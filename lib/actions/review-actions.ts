// "use server";

 import { prisma } from "@/lib/prisma";

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
  