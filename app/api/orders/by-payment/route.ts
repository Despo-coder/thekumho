import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the payment intent ID from query params
    const searchParams = request.nextUrl.searchParams;
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    // Find the order by payment intent ID
    const order = await prisma.order.findFirst({
      where: {
        paymentIntentId,
        userId: session.user.id
      },
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
    });

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