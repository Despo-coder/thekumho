'use server'

import { prisma } from "@/lib/prisma"
import { OrderStatus, PaymentStatus, OrderType } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export type OrderWithItems = {
  id: string
  orderNumber: string | null
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: string | null
  orderType: string
  estimatedPickupTime: Date | null
  completedTime: Date | null
  orderNotes: string | null
  createdAt: Date
  updatedAt: Date
  items: {
    id: string
    quantity: number
    price: number
    specialInstructions: string | null
    menuItem: {
      id: string
      name: string
      image: string | null
      price: number
    }
  }[]
}

export type OrderActionResult = {
  success: boolean
  orders?: OrderWithItems[]
  orderId?: string
  error?: string
}

type OrderItem = {
  menuItemId: string
  quantity: number
  specialInstructions?: string | null
}

type OrderData = {
  items: OrderItem[]
  orderType: OrderType
  orderNotes?: string
  pickupTime?: string
}

type OrderResult = {
  success: boolean
  orderId?: string
  error?: string
}

// Type definitions for better type safety
type OrderWithDetails = {
  id: string;
  orderNumber: string | null;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  orderType: OrderType;
  createdAt: Date;
  estimatedPickupTime: Date | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    menuItem: {
      id: string;
      name: string;
    };
  }>;
  appliedPromotion: {
    id: string;
    name: string;
    couponCode: string | null;
  } | null;
  discountAmount: number;
};

type DashboardStats = {
  totalOrders: number;
  pendingOrders: number;
  todayOrders: number;
  totalBookings: number;
  todayBookings: number;
  todayRevenue: number;
  lastUpdated: string;
};

/**
 * Creates a new order in the database with PENDING status
 * This should be called BEFORE initiating payment
 */
export async function createOrder(
  userId: string,
  orderData: OrderData
): Promise<OrderResult> {
  try {
    // Validate input
    if (!userId) {
      return { success: false, error: "User ID is required" }
    }
    
    if (!orderData.items || orderData.items.length === 0) {
      return { success: false, error: "Order must contain at least one item" }
    }

    // Get menu items to calculate total price
    const itemIds = orderData.items.map(item => item.menuItemId)
    const menuItems = await prisma.menuItem.findMany({
      where: { id: { in: itemIds } }
    })
    
    // Check if all items exist
    if (menuItems.length !== itemIds.length) {
      return { success: false, error: "One or more menu items do not exist" }
    }

    // Calculate prices and create order items
    const orderItemsWithPrices = orderData.items.map(item => {
      const menuItem = menuItems.find(mi => mi.id === item.menuItemId)
      
      if (!menuItem) {
        throw new Error(`Menu item not found: ${item.menuItemId}`)
      }
      
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions || null
      }
    })

    // Calculate order total
    const total = orderItemsWithPrices.reduce(
      (sum, item) => sum + (Number(item.price) * item.quantity), 
      0
    )

    // Create order in database
    const order = await prisma.order.create({
      data: {
        userId,
        total,
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        orderType: orderData.orderType,
        orderNotes: orderData.orderNotes || null,
        estimatedPickupTime: orderData.pickupTime 
          ? new Date(orderData.pickupTime) 
          : null,
        items: {
          create: orderItemsWithPrices
        },
        statusUpdates: {
          create: {
            status: OrderStatus.PENDING,
            note: 'Order created, awaiting payment',
            updatedById: userId,
          }
        }
      }
    })

    console.log(`Order created successfully: ${order.id}`)
    return { success: true, orderId: order.id }
  } catch (error) {
    console.error('Error creating order:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create order'
    }
  }
}

/**
 * Gets an order by ID with related items
 */
export async function getOrderById(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        statusUpdates: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
    
    if (!order) {
      return { error: 'Order not found' }
    }
    
    // Convert Decimal values to numbers before sending to client
    const serializedOrder = {
      ...order,
      total: Number(order.total),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        menuItem: {
          ...item.menuItem,
          price: Number(item.menuItem.price)
        }
      }))
    }
    
    return { order: serializedOrder }
  } catch (error) {
    console.error('Error fetching order:', error)
    return { error: 'Failed to fetch order' }
  }
}

/**
 * Gets orders for a specific user
 */
export async function getUserOrders(userId: string) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            menuItem: true
          }
        },
        statusUpdates: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    // Convert Decimal values to numbers before sending to client
    const serializedOrders = orders.map(order => ({
      ...order,
      total: Number(order.total),
      items: order.items.map(item => ({
        ...item,
        price: Number(item.price),
        menuItem: {
          ...item.menuItem,
          price: Number(item.menuItem.price)
        }
      }))
    }))
    
    return { orders: serializedOrders }
  } catch (error) {
    console.error('Error fetching user orders:', error)
    return { error: 'Failed to fetch orders' }
  }
}

// Authentication helper
async function requireAuth(allowedRoles: string[] = ["ADMIN", "MANAGER", "CHEF", "WAITER"]) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    throw new Error("Unauthorized access");
  }
  
  return session;
}

// Get dashboard statistics
export async function getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
  try {
    await requireAuth();

    // Get today's date range (start and end of today)
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Fetch statistics in parallel
    const [
      totalOrders,
      pendingOrders,
      todayOrders,
      totalBookings,
      todayBookings,
      todayRevenue
    ] = await Promise.all([
      // Total orders count
      prisma.order.count(),
      
      // Pending orders count (orders that need attention)
      prisma.order.count({
        where: {
          status: {
            in: [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING]
          }
        }
      }),
      
      // Today's orders count
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),
      
      // Total bookings count
      prisma.booking.count(),
      
      // Today's bookings count
      prisma.booking.count({
        where: {
          bookingTime: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),
      
      // Today's revenue from sales
      prisma.sale.aggregate({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        _sum: {
          total: true
        }
      })
    ]);

    const stats: DashboardStats = {
      totalOrders,
      pendingOrders,
      todayOrders,
      totalBookings,
      todayBookings,
      todayRevenue: Number(todayRevenue._sum.total) || 0,
      lastUpdated: new Date().toISOString()
    };

    return { success: true, data: stats };

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch dashboard statistics" 
    };
  }
}

// Get orders with filtering and pagination
export async function getOrders({
  page = 1,
  limit = 20,
  status,
  orderType,
  dateFrom,
  dateTo,
  search
}: {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  orderType?: OrderType;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
} = {}): Promise<{ 
  success: boolean; 
  data?: { orders: OrderWithDetails[]; totalCount: number; totalPages: number }; 
  error?: string 
}> {
  try {
    await requireAuth();

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (orderType) {
      where.orderType = orderType;
    }
    
    if (dateFrom || dateTo) {
      const createdAtFilter: { gte?: Date; lte?: Date } = {};
      if (dateFrom) createdAtFilter.gte = dateFrom;
      if (dateTo) createdAtFilter.lte = dateTo;
      where.createdAt = createdAtFilter;
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.order.count({ where });
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Fetch orders with related data
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
                name: true
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

    // Transform data for type safety
    const transformedOrders: OrderWithDetails[] = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      status: order.status,
      paymentStatus: order.paymentStatus,
      orderType: order.orderType,
      createdAt: order.createdAt,
      estimatedPickupTime: order.estimatedPickupTime,
      user: order.user,
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        menuItem: item.menuItem
      })),
      appliedPromotion: order.appliedPromotion,
      discountAmount: Number(order.discountAmount)
    }));

    return { 
      success: true, 
      data: { 
        orders: transformedOrders, 
        totalCount, 
        totalPages 
      } 
    };

  } catch (error) {
    console.error("Error fetching orders:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch orders" 
    };
  }
}

// Update order status
export async function updateOrderStatus(
  orderId: string, 
  newStatus: OrderStatus, 
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await requireAuth();

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newStatus,
        statusUpdates: {
          create: {
            status: newStatus,
            note: note || `Status updated to ${newStatus}`,
            updatedById: session.user.id
          }
        }
      }
    });

    // Revalidate the orders page to reflect changes
    revalidatePath('/admin');
    revalidatePath('/admin/orders');

    return { success: true };

  } catch (error) {
    console.error("Error updating order status:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to update order status" 
    };
  }
}

/**
 * Cancels an order if it's in a cancellable state
 * @param orderId - The ID of the order to cancel
 * @param userId - The ID of the user making the request (for authorization)
 * @returns OrderActionResult indicating success or failure
 */
export async function cancelOrder(orderId: string, userId: string): Promise<OrderActionResult> {
  if (!orderId || !userId) {
    return {
      success: false,
      error: "Order ID and User ID are required"
    }
  }

  try {
    // First verify the order belongs to the user
    const order = await prisma.order.findUnique({
      where: {
        id: orderId,
        userId: userId
      }
    })

    if (!order) {
      return {
        success: false,
        error: "Order not found or you don't have permission to cancel it"
      }
    }

    // Check if the order is in a cancellable state
    const cancellableStates: OrderStatus[] = ['PENDING', 'CONFIRMED']
    if (!cancellableStates.includes(order.status)) {
      return {
        success: false,
        error: "This order cannot be cancelled as it's already being prepared"
      }
    }

    // Update the order status to CANCELED
    const updatedOrder = await prisma.order.update({
      where: {
        id: orderId
      },
      data: {
        status: OrderStatus.CANCELED,
        statusUpdates: {
          create: {
            status: OrderStatus.CANCELED,
            note: "Cancelled by customer",
            updatedById: userId
          }
        }
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                id: true,
                name: true,
                image: true,
                price: true
              }
            }
          }
        }
      }
    })

    // Revalidate the orders page to reflect the cancellation
    revalidatePath('/orders')

    return {
      success: true,
      orders: [updatedOrder as unknown as OrderWithItems]
    }
  } catch (error) {
    console.error("Error cancelling order:", error)
    return {
      success: false,
      error: "Failed to cancel order. Please try again later."
    }
  }
}

// Get recent activity for dashboard
export async function getRecentActivity(limit: number = 10): Promise<{ 
  success: boolean; 
  data?: Array<{
    id: string;
    type: 'order' | 'booking';
    title: string;
    subtitle: string;
    status: string;
    statusColor: string;
    timestamp: Date;
  }>; 
  error?: string 
}> {
  try {
    await requireAuth();

    // Get recent orders
    const recentOrders = await prisma.order.findMany({
      take: Math.ceil(limit / 2),
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      take: Math.ceil(limit / 2),
      orderBy: { createdAt: 'desc' }
    });

    // Transform and combine activities
    const activities = [
      ...recentOrders.map(order => ({
        id: order.id,
        type: 'order' as const,
        title: `Order ${order.orderNumber || `#${order.id.slice(-6)}`}`,
        subtitle: order.user.name || order.user.email || 'Guest',
        status: order.status,
        statusColor: getStatusColor(order.status),
        timestamp: order.createdAt
      })),
      ...recentBookings.map(booking => ({
        id: booking.id.toString(),
        type: 'booking' as const,
        title: `Table for ${booking.partySize}`,
        subtitle: booking.customerName,
        status: booking.status,
        statusColor: getBookingStatusColor(booking.status),
        timestamp: booking.createdAt
      }))
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit);

    return { success: true, data: activities };

  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to fetch recent activity" 
    };
  }
}

// Helper function to get status colors
function getStatusColor(status: OrderStatus): string {
  switch (status) {
    case OrderStatus.PENDING:
      return 'orange';
    case OrderStatus.CONFIRMED:
      return 'blue';
    case OrderStatus.PREPARING:
      return 'yellow';
    case OrderStatus.READY_FOR_PICKUP:
      return 'green';
    case OrderStatus.COMPLETED:
      return 'green';
    case OrderStatus.CANCELED:
      return 'red';
    case OrderStatus.REFUNDED:
      return 'gray';
    default:
      return 'gray';
  }
}

// Helper function to get booking status colors
function getBookingStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'green';
    case 'pending':
      return 'orange';
    case 'cancelled':
      return 'red';
    default:
      return 'gray';
  }
}
