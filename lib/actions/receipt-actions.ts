"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Type definitions for receipt data
type ReceiptData = {
  order: {
    id: string;
    orderNumber: string | null;
    total: number;
    discountAmount: number;
    paymentMethod: string | null;
    orderType: string;
    createdAt: Date;
    estimatedPickupTime: Date | null;
  };
  customer: {
    name: string | null;
    email: string;
  };
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    specialInstructions: string | null;
    menuItem: {
      name: string;
      category: string;
    };
  }>;
  appliedPromotion: {
    name: string;
    couponCode: string | null;
  } | null;
  restaurant: {
    name: string;
    address: string;
    phone: string;
    email: string;
  };
};

type KitchenTicketData = {
  order: {
    id: string;
    orderNumber: string | null;
    orderType: string;
    createdAt: Date;
    estimatedPickupTime: Date | null;
    orderNotes: string | null;
  };
  customer: {
    name: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    specialInstructions: string | null;
    menuItem: {
      name: string;
      category: string;
    };
  }>;
};

type ReceiptResult = {
  success: boolean;
  data?: ReceiptData;
  error?: string;
};

type KitchenTicketResult = {
  success: boolean;
  data?: KitchenTicketData;
  error?: string;
};

// Authentication helper
async function requireAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !["ADMIN", "MANAGER", "CHEF", "WAITER"].includes(session.user.role)) {
    throw new Error("Unauthorized access");
  }
  
  return session;
}

// Restaurant configuration (in a real app, this would come from a settings table)
const RESTAURANT_INFO = {
  name: "Kumho Korean Restaurant",
  address: "123 Main Street, Cityville, State 12345",
  phone: "(555) 123-4567",
  email: "orders@kumho-restaurant.com"
};

// Generate customer receipt data
export async function generateCustomerReceipt(orderId: string): Promise<ReceiptResult> {
  try {
    await requireAuth();

    // Fetch complete order data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        items: {
          include: {
            menuItem: {
              include: {
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
            name: true,
            couponCode: true
          }
        }
      }
    });

    if (!order) {
      return {
        success: false,
        error: "Order not found"
      };
    }

    // Format receipt data
    const receiptData: ReceiptData = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        total: Number(order.total),
        discountAmount: Number(order.discountAmount),
        paymentMethod: order.paymentMethod,
        orderType: order.orderType,
        createdAt: order.createdAt,
        estimatedPickupTime: order.estimatedPickupTime
      },
      customer: {
        name: order.user.name,
        email: order.user.email
      },
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        specialInstructions: item.specialInstructions,
        menuItem: {
          name: item.menuItem.name,
          category: item.menuItem.category.name
        }
      })),
      appliedPromotion: order.appliedPromotion,
      restaurant: RESTAURANT_INFO
    };

    return {
      success: true,
      data: receiptData
    };

  } catch (error) {
    console.error("Error generating customer receipt:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate receipt"
    };
  }
}

// Generate kitchen ticket data
export async function generateKitchenTicket(orderId: string): Promise<KitchenTicketResult> {
  try {
    await requireAuth();

    // Fetch order data needed for kitchen
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            menuItem: {
              include: {
                category: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      return {
        success: false,
        error: "Order not found"
      };
    }

    // Format kitchen ticket data
    const kitchenTicketData: KitchenTicketData = {
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        orderType: order.orderType,
        createdAt: order.createdAt,
        estimatedPickupTime: order.estimatedPickupTime,
        orderNotes: order.orderNotes
      },
      customer: {
        name: order.user.name
      },
      items: order.items.map(item => ({
        id: item.id,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions,
        menuItem: {
          name: item.menuItem.name,
          category: item.menuItem.category.name
        }
      }))
    };

    return {
      success: true,
      data: kitchenTicketData
    };

  } catch (error) {
    console.error("Error generating kitchen ticket:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate kitchen ticket"
    };
  }
}

// Generate HTML receipt for printing
export async function generateReceiptHTML(orderId: string): Promise<{ success: boolean; html?: string; error?: string }> {
  try {
    const receiptResult = await generateCustomerReceipt(orderId);
    
    if (!receiptResult.success || !receiptResult.data) {
      return {
        success: false,
        error: receiptResult.error || "Failed to generate receipt data"
      };
    }

    const receipt = receiptResult.data;
    const subtotal = receipt.order.total + receipt.order.discountAmount;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt - ${receipt.order.orderNumber || `#${receipt.order.id.slice(-6)}`}</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
            font-size: 12px; 
            line-height: 1.4;
        }
        .receipt { 
            max-width: 300px; 
            margin: 0 auto; 
            border: 1px solid #ddd; 
            padding: 20px; 
        }
        .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #000; 
            padding-bottom: 10px; 
        }
        .restaurant-name { 
            font-size: 16px; 
            font-weight: bold; 
            margin-bottom: 5px; 
        }
        .order-info { 
            margin-bottom: 15px; 
            padding-bottom: 10px; 
            border-bottom: 1px dashed #999; 
        }
        .items { 
            margin-bottom: 15px; 
        }
        .item { 
            margin-bottom: 8px; 
        }
        .item-line { 
            display: flex; 
            justify-content: space-between; 
        }
        .totals { 
            border-top: 1px solid #000; 
            padding-top: 10px; 
        }
        .total-line { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 5px; 
        }
        .final-total { 
            font-weight: bold; 
            font-size: 14px; 
            border-top: 1px solid #000; 
            padding-top: 5px; 
            margin-top: 5px; 
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            padding-top: 10px; 
            border-top: 1px dashed #999; 
            font-size: 10px; 
        }
        @media print {
            body { margin: 0; padding: 10px; }
            .receipt { border: none; }
        }
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <div class="restaurant-name">${receipt.restaurant.name}</div>
            <div>${receipt.restaurant.address}</div>
            <div>${receipt.restaurant.phone}</div>
            <div>${receipt.restaurant.email}</div>
        </div>

        <div class="order-info">
            <div><strong>Order:</strong> ${receipt.order.orderNumber || `#${receipt.order.id.slice(-6)}`}</div>
            <div><strong>Type:</strong> ${receipt.order.orderType === 'PICKUP' ? 'Pickup' : 'Dine In'}</div>
            <div><strong>Date:</strong> ${new Date(receipt.order.createdAt).toLocaleString()}</div>
            <div><strong>Customer:</strong> ${receipt.customer.name || receipt.customer.email}</div>
            ${receipt.order.estimatedPickupTime ? `<div><strong>Pickup Time:</strong> ${new Date(receipt.order.estimatedPickupTime).toLocaleString()}</div>` : ''}
        </div>

        <div class="items">
            <div style="font-weight: bold; border-bottom: 1px solid #999; padding-bottom: 5px; margin-bottom: 10px;">
                Order Items:
            </div>
            ${receipt.items.map(item => `
                <div class="item">
                    <div class="item-line">
                        <span>${item.quantity}x ${item.menuItem.name}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                    ${item.specialInstructions ? `<div style="font-size: 10px; margin-left: 10px; color: #666;">Note: ${item.specialInstructions}</div>` : ''}
                </div>
            `).join('')}
        </div>

        <div class="totals">
            <div class="total-line">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            ${receipt.order.discountAmount > 0 ? `
                <div class="total-line" style="color: green;">
                    <span>Discount${receipt.appliedPromotion ? ` (${receipt.appliedPromotion.name})` : ''}:</span>
                    <span>-$${receipt.order.discountAmount.toFixed(2)}</span>
                </div>
            ` : ''}
            <div class="total-line final-total">
                <span>Total:</span>
                <span>$${receipt.order.total.toFixed(2)}</span>
            </div>
            ${receipt.order.paymentMethod ? `
                <div class="total-line">
                    <span>Payment:</span>
                    <span>${receipt.order.paymentMethod}</span>
                </div>
            ` : ''}
        </div>

        <div class="footer">
            <div>Thank you for your order!</div>
            <div>Please keep this receipt for your records.</div>
            ${receipt.order.orderType === 'PICKUP' ? '<div style="margin-top: 10px; font-weight: bold;">*** PICKUP ORDER ***</div>' : ''}
        </div>
    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>`;

    return {
      success: true,
      html
    };

  } catch (error) {
    console.error("Error generating receipt HTML:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate receipt HTML"
    };
  }
}

// Generate HTML kitchen ticket for printing
export async function generateKitchenTicketHTML(orderId: string): Promise<{ success: boolean; html?: string; error?: string }> {
  try {
    const ticketResult = await generateKitchenTicket(orderId);
    
    if (!ticketResult.success || !ticketResult.data) {
      return {
        success: false,
        error: ticketResult.error || "Failed to generate kitchen ticket data"
      };
    }

    const ticket = ticketResult.data;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Kitchen Ticket - ${ticket.order.orderNumber || `#${ticket.order.id.slice(-6)}`}</title>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            margin: 0; 
            padding: 20px; 
            font-size: 14px; 
            line-height: 1.6;
        }
        .ticket { 
            max-width: 400px; 
            margin: 0 auto; 
            border: 2px solid #000; 
            padding: 15px; 
        }
        .header { 
            text-align: center; 
            margin-bottom: 20px; 
            border-bottom: 2px solid #000; 
            padding-bottom: 15px; 
        }
        .kitchen-title { 
            font-size: 20px; 
            font-weight: bold; 
            margin-bottom: 10px; 
        }
        .order-info { 
            margin-bottom: 20px; 
            background: #f5f5f5; 
            padding: 10px; 
            border: 1px solid #ddd; 
        }
        .items { 
            margin-bottom: 15px; 
        }
        .item { 
            margin-bottom: 15px; 
            padding: 10px; 
            background: #fff; 
            border: 1px solid #ddd; 
        }
        .item-header { 
            font-weight: bold; 
            font-size: 16px; 
            margin-bottom: 5px; 
        }
        .quantity { 
            background: #000; 
            color: #fff; 
            padding: 2px 8px; 
            border-radius: 3px; 
            font-weight: bold; 
        }
        .special-instructions { 
            background: #ffffcc; 
            padding: 5px; 
            margin-top: 5px; 
            border-left: 3px solid #ffcc00; 
            font-weight: bold; 
        }
        .category { 
            color: #666; 
            font-size: 12px; 
            text-transform: uppercase; 
        }
        .footer { 
            text-align: center; 
            margin-top: 20px; 
            padding-top: 15px; 
            border-top: 2px solid #000; 
            font-weight: bold; 
        }
        @media print {
            body { margin: 0; padding: 10px; }
            .ticket { border: 2px solid #000; }
        }
    </style>
</head>
<body>
    <div class="ticket">
        <div class="header">
            <div class="kitchen-title">🍳 KITCHEN TICKET 🍳</div>
            <div style="font-size: 18px; font-weight: bold;">
                Order ${ticket.order.orderNumber || `#${ticket.order.id.slice(-6)}`}
            </div>
        </div>

        <div class="order-info">
            <div><strong>Order Type:</strong> ${ticket.order.orderType === 'PICKUP' ? '📦 PICKUP' : '🍽️ DINE IN'}</div>
            <div><strong>Order Time:</strong> ${new Date(ticket.order.createdAt).toLocaleString()}</div>
            ${ticket.customer.name ? `<div><strong>Customer:</strong> ${ticket.customer.name}</div>` : ''}
            ${ticket.order.estimatedPickupTime ? `<div><strong>Pickup Time:</strong> ${new Date(ticket.order.estimatedPickupTime).toLocaleString()}</div>` : ''}
            ${ticket.order.orderNotes ? `<div style="margin-top: 10px;"><strong>Order Notes:</strong><br>${ticket.order.orderNotes}</div>` : ''}
        </div>

        <div class="items">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 15px; text-align: center; background: #000; color: #fff; padding: 8px;">
                ITEMS TO PREPARE
            </div>
            ${ticket.items.map(item => `
                <div class="item">
                    <div class="item-header">
                        <span class="quantity">${item.quantity}</span>
                        ${item.menuItem.name}
                        <div class="category">${item.menuItem.category}</div>
                    </div>
                    ${item.specialInstructions ? `
                        <div class="special-instructions">
                            ⚠️ SPECIAL INSTRUCTIONS: ${item.specialInstructions}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="footer">
            <div style="font-size: 16px;">--- KITCHEN COPY ---</div>
            <div style="margin-top: 10px; font-size: 12px;">
                Printed at: ${new Date().toLocaleString()}
            </div>
        </div>
    </div>

    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>`;

    return {
      success: true,
      html
    };

  } catch (error) {
    console.error("Error generating kitchen ticket HTML:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to generate kitchen ticket HTML"
    };
  }
} 