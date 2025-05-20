import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/auth";
import { prisma } from "@/lib/prisma";
import { OrderType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // Only admins/staff can see others' orders
    if (userId && userId !== session.user.id && 
        session.user.role !== "ADMIN" && 
        session.user.role !== "MANAGER" && 
        session.user.role !== "CHEF" &&
        session.user.role !== "WAITER") {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }
    
    const orders = await prisma.order.findMany({
      where: {
        userId: userId || session.user.id
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { message: "An error occurred fetching orders" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const body = await req.json();
    const { items, specialInstructions, orderType = "PICKUP" } = body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "Order must include at least one item" },
        { status: 400 }
      );
    }
    
    // Calculate order total
    let total = 0;
    const orderItems = [];
    
    // Fetch menu items to get accurate pricing
    const menuItemIds = items.map(item => item.menuItemId);
    const menuItems = await prisma.menuItem.findMany({
      where: {
        id: {
          in: menuItemIds
        }
      }
    });
    
    // Create a map for easy lookup
    const menuItemMap = new Map();
    menuItems.forEach(item => {
      menuItemMap.set(item.id, item);
    });
    
    // Prepare order items and calculate total
    for (const item of items) {
      const menuItem = menuItemMap.get(item.menuItemId);
      
      if (!menuItem) {
        return NextResponse.json(
          { message: `Menu item with ID ${item.menuItemId} not found` },
          { status: 400 }
        );
      }
      
      if (!menuItem.isAvailable) {
        return NextResponse.json(
          { message: `Menu item "${menuItem.name}" is currently unavailable` },
          { status: 400 }
        );
      }
      
      const itemTotal = parseFloat(menuItem.price.toString()) * item.quantity;
      total += itemTotal;
      
      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: menuItem.price,
        specialInstructions: item.specialInstructions
      });
    }
    
    // Create order with order number
    const orderNumber = generateOrderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber,
        total,
        status: "PENDING",
        paymentStatus: "PENDING",
        orderType: orderType as OrderType,
        orderNotes: specialInstructions,
        userId: session.user.id,
        items: {
          create: orderItems
        }
      },
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json(
      { order, message: "Order created successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { message: "An error occurred creating the order" },
      { status: 500 }
    );
  }
}

// Helper function to generate order number
function generateOrderNumber(): string {
  const prefix = "ORD";
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}${random}`;
} 