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
    
    return { order }
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
    
    return { orders }
  } catch (error) {
    console.error('Error fetching user orders:', error)
    return { error: 'Failed to fetch orders' }
  }
}

/**
 * Updates an order's status
 */
export async function updateOrderStatus(
  orderId: string, 
  status: OrderStatus, 
  note?: string
) {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return { success: false, error: 'Unauthorized' }
  }
  
  try {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        statusUpdates: {
          create: {
            status,
            note: note || `Status updated to ${status}`,
            updatedById: session.user.id,
          }
        }
      }
    })
    
    // Revalidate any paths that show orders
    revalidatePath('/admin/orders')
    revalidatePath('/orders')
    
    return { success: true, order }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { success: false, error: 'Failed to update order status' }
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
