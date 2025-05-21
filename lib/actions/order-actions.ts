'use server'

import { prisma } from "@/lib/prisma"
import { OrderStatus, PaymentStatus } from "@prisma/client"
import { revalidatePath } from "next/cache"

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
  error?: string
}

/**
 * Fetches all orders for a specific user
 * @param userId - The ID of the user
 * @returns OrderActionResult containing orders or error message
 */
export async function getUserOrders(userId: string): Promise<OrderActionResult> {
  if (!userId) {
    return {
      success: false,
      error: "User ID is required"
    }
  }

  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: userId
      },
      orderBy: {
        createdAt: 'desc'
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

    // Revalidate the orders page to reflect the latest data
    revalidatePath('/orders')

    return {
      success: true,
      orders: orders as unknown as OrderWithItems[]
    }
  } catch (error) {
    console.error("Error fetching user orders:", error)
    return {
      success: false,
      error: "Failed to fetch orders. Please try again later."
    }
  }
}

/**
 * Fetches a specific order by ID
 * @param orderId - The ID of the order
 * @returns OrderActionResult containing the order or error message
 */
export async function getOrderById(orderId: string): Promise<OrderActionResult> {
  if (!orderId) {
    return {
      success: false,
      error: "Order ID is required"
    }
  }

  try {
    const order = await prisma.order.findUnique({
      where: {
        id: orderId
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

    if (!order) {
      return {
        success: false,
        error: "Order not found"
      }
    }

    return {
      success: true,
      orders: [order as unknown as OrderWithItems]
    }
  } catch (error) {
    console.error("Error fetching order details:", error)
    return {
      success: false,
      error: "Failed to fetch order details. Please try again later."
    }
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
