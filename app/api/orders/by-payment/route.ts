import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { OrderStatus, PaymentStatus, Prisma } from '@prisma/client';

// Define the type for the order with items
type OrderWithItems = {
  id: string;
  orderNumber: string | null;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  estimatedPickupTime: Date | null;
  items: {
    quantity: number;
    price: number;
    menuItem: {
      name: string;
      image: string | null;
      price: number;
    }
  }[];
}

export async function GET(request: NextRequest) {
  try {
    // Get the payment intent ID from query params
    const searchParams = request.nextUrl.searchParams;
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    // Check authentication (optional - will filter by user ID if authenticated)
    const session = await getServerSession(authOptions);
    
    // Set up basic query parameters
    const where: Prisma.OrderWhereInput = {
      paymentIntentId
    };
    
    // If user is authenticated, only show their orders
    if (session?.user) {
      where.userId = session.user.id;
    }
    
    // Find the order by payment intent ID
    const orderQuery: Prisma.OrderFindFirstArgs = {
      where,
      include: {
        items: {
          include: {
            menuItem: {
              select: {
                name: true,
                image: true,
                price: true
              }
            }
          }
        }
      }
    };

    const order = await prisma.order.findFirst(orderQuery) as unknown as OrderWithItems;

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Format the order data for the client
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      status: order.status,
      pickupTime: order.estimatedPickupTime ? format(order.estimatedPickupTime, 'h:mm a, MMM d, yyyy') : null,
      items: order.items.map(item => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: Number(item.price),
        image: item.menuItem.image
      }))
    };

    return NextResponse.json({ 
      order: formattedOrder,
      success: true
    });
  } catch (error) {
    console.error('Error fetching order by payment intent:', error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
} 