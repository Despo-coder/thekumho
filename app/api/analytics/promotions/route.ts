import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and has admin/manager role
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date range from query params (default to last 30 days)
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch promotion usage data with related information
    const promotionUsages = await prisma.promotionUsage.findMany({
      where: {
        createdAt: {
          gte: startDate
        }
      },
      include: {
        promotion: {
          select: {
            id: true,
            name: true,
            promotionType: true,
            couponCode: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate basic metrics
    const totalUsages = promotionUsages.length;
    const totalRevenue = promotionUsages.reduce((sum, usage) => sum + Number(usage.finalAmount), 0);
    const totalDiscounts = promotionUsages.reduce((sum, usage) => sum + Number(usage.discountAmount), 0);
    const averageOrderValue = totalUsages > 0 ? totalRevenue / totalUsages : 0;

    // Calculate top performing promotions
    const promotionStats = new Map();
    promotionUsages.forEach(usage => {
      const promotionId = usage.promotionId;
      const currentStats = promotionStats.get(promotionId) || {
        promotionId,
        name: usage.promotion.name,
        usageCount: 0,
        totalDiscount: 0,
        revenueImpact: 0
      };
      
      currentStats.usageCount += 1;
      currentStats.totalDiscount += Number(usage.discountAmount);
      currentStats.revenueImpact += Number(usage.finalAmount);
      
      promotionStats.set(promotionId, currentStats);
    });

    const topPromotions = Array.from(promotionStats.values())
      .sort((a, b) => b.revenueImpact - a.revenueImpact)
      .slice(0, 5);

    // Calculate customer segments
    const segmentStats = new Map();
    promotionUsages.forEach(usage => {
      const segment = usage.customerSegment || 'unknown';
      segmentStats.set(segment, (segmentStats.get(segment) || 0) + 1);
    });

    const customerSegments = Array.from(segmentStats.entries()).map(([segment, count]) => ({
      segment,
      count,
      percentage: totalUsages > 0 ? (count / totalUsages) * 100 : 0
    }));

    // Prepare recent usages (limit to 10 most recent)
    const recentUsages = promotionUsages.slice(0, 10).map(usage => ({
      id: usage.id,
      promotionId: usage.promotionId,
      promotion: {
        id: usage.promotion.id,
        name: usage.promotion.name,
        promotionType: usage.promotion.promotionType,
        couponCode: usage.promotion.couponCode
      },
      discountAmount: Number(usage.discountAmount),
      originalAmount: Number(usage.originalAmount),
      finalAmount: Number(usage.finalAmount),
      customerSegment: usage.customerSegment,
      orderType: usage.orderType,
      isFirstTimeUse: usage.isFirstTimeUse,
      createdAt: usage.createdAt.toISOString()
    }));

    const analyticsData = {
      totalUsages,
      totalRevenue,
      totalDiscounts,
      averageOrderValue,
      topPromotions,
      customerSegments,
      recentUsages,
      dateRange: {
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
        days
      }
    };

    return NextResponse.json(analyticsData);

  } catch (error) {
    console.error("Error fetching promotion analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    );
  }
} 