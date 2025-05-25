'use server'

import { prisma } from "@/lib/prisma";
import { insertReviewSchema } from "@/lib/validators/review";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Helper function to format errors
function formatError(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }
    return String(error);
}

//Create and Update Review
export async function createUpdateReview(data: z.infer<typeof insertReviewSchema>) {
    const session = await getServerSession(authOptions)
    const user = session?.user?.id

    try {
        if (!user) {
            return { success: false, message: 'You are not Authorized' }
        }
        
        //Validate Fields
        const validatedFields = insertReviewSchema.safeParse({ ...data, userId: user })
        if (!validatedFields.success) {
            return { success: false, message: "Invalid fields" }
        }
        
        //Check Menu Item
        const menuItem = await prisma.menuItem.findUnique({
            where: { id: validatedFields.data.menuItemId }
        })
        if (!menuItem) {
            return { success: false, message: 'Menu item not found' }
        }
        
        //Check if user has purchased this item (verified purchase)
        const hasPurchased = await getVerifiedPurchase({ menuItemId: validatedFields.data.menuItemId })
        if (!hasPurchased) {
            return { success: false, message: 'You can only review items you have purchased' }
        }
        
        //Check if user has already reviewed the menu item
        const reviewExists = await prisma.review.findFirst({
            where: {
                menuItemId: validatedFields.data.menuItemId,
                userId: user
            }
        })
        
        //Update or Create Review
        await prisma.$transaction(async (tx) => {
            if (reviewExists) {
                await tx.review.update({
                    where: { id: reviewExists.id },
                    data: {
                        title: validatedFields.data.title,
                        content: validatedFields.data.description,
                        rating: validatedFields.data.rating
                    }
                })
            } else {
                const { description, ...rest } = validatedFields.data;
                await tx.review.create({
                    data: {
                        ...rest,
                        content: description
                    }
                })
            }
            
            //Get Average Rating
            // const averageRating = await tx.review.aggregate({
            //     _avg: {
            //         rating: true
            //     },
            //     where: {
            //         menuItemId: validatedFields.data.menuItemId
            //     }
            // })
            
            //Get Number of Reviews
            // const numberOfReviews = await tx.review.count({
            //     where: {
            //         menuItemId: validatedFields.data.menuItemId
            //     }
            // })
            
            //Update Rating and NumReviews in MenuItem Table (if you want to add these fields)
            // Note: Your current schema doesn't have rating/numReviews fields on MenuItem
            // You might want to add them for performance optimization
        })
        
        revalidatePath(`/menu`)
        revalidatePath(`/`)
        return { success: true, message: 'Review submitted successfully' }
    } catch (error) {
        return { success: false, message: formatError(error) }
    }
}

//Get All Reviews for a Menu Item
export async function getAllReviews({ menuItemId }: { menuItemId: string }) {
    const reviews = await prisma.review.findMany({
        where: { menuItemId },
        include: {
            user: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
    return reviews
}

//Get Review for a User for a specific Menu Item
export async function getAllReviewsForUser({ menuItemId }: { menuItemId: string }) {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error('User is not authenticated');

    return await prisma.review.findFirst({
        where: { menuItemId, userId: session?.user.id },
    });
}

//Get only Reviews for a verified purchase
export async function getVerifiedPurchase({ menuItemId }: { menuItemId: string }) {
    const session = await getServerSession(authOptions);
    if (!session) return false

    const hasPurchased = await prisma.orderItem.findFirst({
        where: {
            menuItemId,
            order: {
                userId: session?.user.id,
                //Either completed, preparing or ready for pickup
                status: {
                    in: ['COMPLETED', 'PREPARING', 'READY_FOR_PICKUP']
                }
            },
        },
    })
    return !!hasPurchased
}

//Get verified testimonials for homepage
export async function getVerifiedTestimonials() {
    return await prisma.review.findMany({
        where: { isVerified: true },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
            menuItem: {
                select: {
                    name: true,
                    image: true,
                },
            },
            user: {
                select: {
                    name: true,
                },
            },
        },
    });
}

//Get review statistics for a menu item
export async function getMenuItemReviewStats({ menuItemId }: { menuItemId: string }) {
    const stats = await prisma.review.aggregate({
        where: { menuItemId },
        _avg: { rating: true },
        _count: { id: true }
    })
    
    const ratingDistribution = await prisma.review.groupBy({
        by: ['rating'],
        where: { menuItemId },
        _count: { rating: true },
        orderBy: { rating: 'desc' }
    })
    
    return {
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count.id,
        ratingDistribution
    }
}
  