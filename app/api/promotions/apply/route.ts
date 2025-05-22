import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function POST(request: NextRequest) {
    try {
        // Check authorization
        const session = await getServerSession(authOptions);
        
        if (!session) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const { promotionId, orderId } = await request.json();

        if (!promotionId || !orderId) {
            return NextResponse.json(
                { error: "Promotion ID and Order ID are required" },
                { status: 400 }
            );
        }

        // Check if promotion exists
        const promotion = await prisma.promotion.findUnique({
            where: { id: promotionId }
        });

        if (!promotion) {
            return NextResponse.json(
                { error: "Promotion not found" },
                { status: 404 }
            );
        }

        // Check if order exists and belongs to the user
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { userId: true, appliedPromotionId: true }
        });

        if (!order) {
            return NextResponse.json(
                { error: "Order not found" },
                { status: 404 }
            );
        }

        if (order.userId !== session.user.id && session.user.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Not authorized to modify this order" },
                { status: 403 }
            );
        }

        // Check if order already has a promotion applied
        if (order.appliedPromotionId) {
            return NextResponse.json(
                { error: "Order already has a promotion applied" },
                { status: 400 }
            );
        }

        // Update the promotion usage count
        await prisma.promotion.update({
            where: { id: promotionId },
            data: { 
                usageCount: { increment: 1 },
                appliedOrders: { connect: { id: orderId } }
            }
        });

        // Update the order with the promotion
        await prisma.order.update({
            where: { id: orderId },
            data: { appliedPromotionId: promotionId }
        });

        return NextResponse.json({
            success: true,
            message: "Promotion applied to order successfully"
        });
    } catch (error) {
        console.error("Error applying promotion:", error);
        return NextResponse.json(
            { error: "Failed to apply promotion to order" },
            { status: 500 }
        );
    }
} 