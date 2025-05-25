"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OrderStatus, OrderType } from "@prisma/client";

// Type definitions for analytics
type DateRange = {
  from: Date;
  to: Date;
};

type RevenueAnalytics = {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  revenueByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  revenueByType: Array<{
    type: OrderType;
    revenue: number;
    orders: number;
    percentage: number;
  }>;
};

type PopularItem = {
  id: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
  category: string;
};

type OrderCompletionMetrics = {
  averageCompletionTime: number; // in minutes
  completionTimeByStatus: Array<{
    status: OrderStatus;
    averageTime: number;
  }>;
  peakHours: Array<{
    hour: number;
    orderCount: number;
  }>;
};

type CustomerAnalytics = {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  topCustomers: Array<{
    id: string;
    name: string | null;
    email: string;
    totalOrders: number;
    totalSpent: number;
  }>;
};

type AnalyticsResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Authentication helper
async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !["ADMIN", "MANAGER"].includes(session.user.role)) {
    throw new Error("Unauthorized access");
  }
  
  return session;
}

// Get revenue analytics for a date range
export async function getRevenueAnalytics(
  dateRange: DateRange
): Promise<AnalyticsResult<RevenueAnalytics>> {
  try {
    await requireAuth();

    const { from, to } = dateRange;

    // Get orders within date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to
        },
        status: {
          not: OrderStatus.CANCELED
        }
      },
      include: {
        items: true
      }
    });

    // Calculate total revenue and orders
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group revenue by day
    const revenueByDay = new Map<string, { revenue: number; orders: number }>();
    
    orders.forEach(order => {
      const date = order.createdAt.toISOString().split('T')[0];
      const existing = revenueByDay.get(date) || { revenue: 0, orders: 0 };
      revenueByDay.set(date, {
        revenue: existing.revenue + Number(order.total),
        orders: existing.orders + 1
      });
    });

    const revenueByDayArray = Array.from(revenueByDay.entries()).map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Group revenue by order type
    const revenueByType = new Map<OrderType, { revenue: number; orders: number }>();
    
    orders.forEach(order => {
      const existing = revenueByType.get(order.orderType) || { revenue: 0, orders: 0 };
      revenueByType.set(order.orderType, {
        revenue: existing.revenue + Number(order.total),
        orders: existing.orders + 1
      });
    });

    const revenueByTypeArray = Array.from(revenueByType.entries()).map(([type, data]) => ({
      type,
      revenue: data.revenue,
      orders: data.orders,
      percentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0
    }));

    const analytics: RevenueAnalytics = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      revenueByDay: revenueByDayArray,
      revenueByType: revenueByTypeArray
    };

    return { success: true, data: analytics };

  } catch (error) {
    console.error("Error fetching revenue analytics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch revenue analytics"
    };
  }
}

// Get popular items analysis
export async function getPopularItems(
  dateRange: DateRange,
  limit: number = 10
): Promise<AnalyticsResult<PopularItem[]>> {
  try {
    await requireAuth();

    const { from, to } = dateRange;

    // Get order items within date range
    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: from,
            lte: to
          },
          status: {
            not: OrderStatus.CANCELED
          }
        }
      },
      include: {
        menuItem: {
          include: {
            category: true
          }
        },
        order: true
      }
    });

    // Group by menu item
    const itemStats = new Map<string, {
      item: {
        id: string;
        name: string;
        category: { name: string };
      };
      totalQuantity: number;
      totalRevenue: number;
      orders: Set<string>;
    }>();

    orderItems.forEach(orderItem => {
      const key = orderItem.menuItem.id;
      const existing = itemStats.get(key) || {
        item: orderItem.menuItem,
        totalQuantity: 0,
        totalRevenue: 0,
        orders: new Set<string>()
      };

      existing.totalQuantity += orderItem.quantity;
      existing.totalRevenue += Number(orderItem.price) * orderItem.quantity;
      existing.orders.add(orderItem.orderId);
      
      itemStats.set(key, existing);
    });

    // Convert to array and sort by total quantity
    const popularItems: PopularItem[] = Array.from(itemStats.entries())
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([_, stats]) => ({
        id: stats.item.id,
        name: stats.item.name,
        totalQuantity: stats.totalQuantity,
        totalRevenue: stats.totalRevenue,
        orderCount: stats.orders.size,
        category: stats.item.category.name
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);

    return { success: true, data: popularItems };

  } catch (error) {
    console.error("Error fetching popular items:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch popular items"
    };
  }
}

// Get order completion metrics
export async function getOrderCompletionMetrics(
  dateRange: DateRange
): Promise<AnalyticsResult<OrderCompletionMetrics>> {
  try {
    await requireAuth();

    const { from, to } = dateRange;

    // Get completed orders with status updates
    const completedOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to
        },
        status: OrderStatus.COMPLETED
      },
      include: {
        statusUpdates: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Calculate completion times
    const completionTimes: number[] = [];
    const statusCompletionTimes = new Map<OrderStatus, number[]>();

    completedOrders.forEach(order => {
      const statusUpdates = order.statusUpdates;
      if (statusUpdates.length >= 2) {
        const startTime = statusUpdates[0].createdAt;
        const endTime = statusUpdates[statusUpdates.length - 1].createdAt;
        const completionTime = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // minutes
        
        completionTimes.push(completionTime);

        // Track completion time by status transitions
        for (let i = 1; i < statusUpdates.length; i++) {
          const prevUpdate = statusUpdates[i - 1];
          const currentUpdate = statusUpdates[i];
          const statusTime = (currentUpdate.createdAt.getTime() - prevUpdate.createdAt.getTime()) / (1000 * 60);
          
          const existing = statusCompletionTimes.get(currentUpdate.status) || [];
          existing.push(statusTime);
          statusCompletionTimes.set(currentUpdate.status, existing);
        }
      }
    });

    const averageCompletionTime = completionTimes.length > 0 
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length 
      : 0;

    const completionTimeByStatus = Array.from(statusCompletionTimes.entries()).map(([status, times]) => ({
      status,
      averageTime: times.reduce((sum, time) => sum + time, 0) / times.length
    }));

    // Get peak hours analysis
    const allOrders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to
        }
      }
    });

    const hourCounts = new Map<number, number>();
    allOrders.forEach(order => {
      const hour = order.createdAt.getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });

    const peakHours = Array.from(hourCounts.entries())
      .map(([hour, count]) => ({ hour, orderCount: count }))
      .sort((a, b) => b.orderCount - a.orderCount);

    const metrics: OrderCompletionMetrics = {
      averageCompletionTime,
      completionTimeByStatus,
      peakHours
    };

    return { success: true, data: metrics };

  } catch (error) {
    console.error("Error fetching order completion metrics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch completion metrics"
    };
  }
}

// Get customer analytics
export async function getCustomerAnalytics(
  dateRange: DateRange
): Promise<AnalyticsResult<CustomerAnalytics>> {
  try {
    await requireAuth();

    const { from, to } = dateRange;

    // Get all customers who placed orders in the date range
    const ordersInRange = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: from,
          lte: to
        },
        status: {
          not: OrderStatus.CANCELED
        }
      },
      include: {
        user: true
      }
    });

    // Get customer statistics
    const customerStats = new Map<string, {
      user: {
        id: string;
        name: string | null;
        email: string;
      };
      orders: number;
      totalSpent: number;
      firstOrderInRange: Date;
    }>();

    ordersInRange.forEach(order => {
      const userId = order.userId;
      const existing = customerStats.get(userId) || {
        user: order.user,
        orders: 0,
        totalSpent: 0,
        firstOrderInRange: order.createdAt
      };

      existing.orders += 1;
      existing.totalSpent += Number(order.total);
      if (order.createdAt < existing.firstOrderInRange) {
        existing.firstOrderInRange = order.createdAt;
      }

      customerStats.set(userId, existing);
    });

    const totalCustomers = customerStats.size;

    // Check for new vs returning customers
    let newCustomers = 0;
    let returningCustomers = 0;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [userId, _] of customerStats.entries()) {
      // Check if user had orders before this date range
      const whereClause: {
        userId: string;
        createdAt: { lt: Date };
      } = {
        userId,
        createdAt: {
          lt: from
        }
      };

      const previousOrders = await prisma.order.count({ where: whereClause });

      if (previousOrders === 0) {
        newCustomers++;
      } else {
        returningCustomers++;
      }
    }

    // Get top customers
    const topCustomers = Array.from(customerStats.entries())
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(([_, stats]) => ({
        id: stats.user.id,
        name: stats.user.name,
        email: stats.user.email,
        totalOrders: stats.orders,
        totalSpent: stats.totalSpent
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    const analytics: CustomerAnalytics = {
      totalCustomers,
      newCustomers,
      returningCustomers,
      topCustomers
    };

    return { success: true, data: analytics };

  } catch (error) {
    console.error("Error fetching customer analytics:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch customer analytics"
    };
  }
}

// Get order history with advanced filtering
export async function getOrderHistory({
  page = 1,
  limit = 50,
  dateRange,
  status,
  orderType,
  customerId,
  minAmount,
  maxAmount
}: {
  page?: number;
  limit?: number;
  dateRange?: DateRange;
  status?: OrderStatus;
  orderType?: OrderType;
  customerId?: string;
  minAmount?: number;
  maxAmount?: number;
} = {}): Promise<AnalyticsResult<{
  orders: Array<{
    id: string;
    total: number;
    discountAmount: number;
    items: Array<{
      price: number;
      [key: string]: unknown;
    }>;
    [key: string]: unknown;
  }>;
  totalCount: number;
  totalPages: number;
  totalRevenue: number;
}>> {
  try {
    await requireAuth();

    // Build where clause
    const where: Record<string, unknown> = {};

    if (dateRange) {
      where.createdAt = {
        gte: dateRange.from,
        lte: dateRange.to
      };
    }

    if (status) {
      where.status = status;
    }

    if (orderType) {
      where.orderType = orderType;
    }

    if (customerId) {
      where.userId = customerId;
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      const totalFilter: { gte?: number; lte?: number } = {};
      if (minAmount !== undefined) totalFilter.gte = minAmount;
      if (maxAmount !== undefined) totalFilter.lte = maxAmount;
      where.total = totalFilter;
    }

    // Get total count and revenue
    const [totalCount, totalRevenueResult] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.aggregate({
        where,
        _sum: {
          total: true
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Get orders
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        appliedPromotion: {
          select: {
            id: true,
            name: true,
            couponCode: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Transform data
    const transformedOrders = orders.map(order => ({
      ...order,
      total: Number(order.total),
      discountAmount: Number(order.discountAmount),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price)
      }))
    }));

    return {
      success: true,
      data: {
        orders: transformedOrders,
        totalCount,
        totalPages,
        totalRevenue: Number(totalRevenueResult._sum.total) || 0
      }
    };

  } catch (error) {
    console.error("Error fetching order history:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch order history"
    };
  }
} 