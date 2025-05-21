import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, OrderType } from '@prisma/client';

// Initialize Stripe with the secret API key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Define the POST handler function for the Stripe webhook
export async function POST(req: NextRequest) {
  try {
    // For webhook signature verification, we need the raw body exactly as it was sent
    // Using the Request.clone() approach to prevent body stream from being consumed twice
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header in webhook request');
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    console.log('Received webhook with signature:', signature.slice(0, 20) + '...');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    // Only use test webhook secret in development as a fallback
    const testWebhookSecret = 
      process.env.NODE_ENV === 'development' && !webhookSecret 
        ? 'whsec_test_12345678901234567890123456789012' 
        : '';

    let event: Stripe.Event;

    try {
      // Log the first few characters of the body for debugging
      console.log('Raw webhook body (first 100 chars):', rawBody.slice(0, 100) + '...');
      
      // Attempt to construct the event
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret || testWebhookSecret
      );
      console.log(`Successfully verified and received Stripe webhook event: ${event.type}`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Webhook signature verification failed: ${error.message}`);
      
      // Return a 400 error to tell Stripe to retry the webhook
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      );
    }

    // Handle the event based on its type
    try {
      switch (event.type) {
        case 'charge.succeeded':
          await handleChargeSucceeded(event.data.object as Stripe.Charge);
          break;
        case 'payment_intent.succeeded':
          await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'checkout.session.completed':
          await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Error handling ${event.type} event:`, error);
      console.error("Error stack:", error.stack);
      // Return 200 so Stripe doesn't retry - we've logged the error and can investigate
      return NextResponse.json(
        { received: true, type: event.type, warning: "Event processed with errors" },
        { status: 200 }
      );
    }

    // Return a 200 success response to acknowledge receipt of the event
    return NextResponse.json({ received: true, type: event.type });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error processing webhook:', err.message);
    console.error('Error stack:', err.stack);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

const handleChargeSucceeded = async (charge: Stripe.Charge) => {
  try {
    console.log('Processing charge.succeeded event:', charge.id);
    console.log('Charge metadata:', JSON.stringify(charge.metadata || {}));
    
    const { metadata } = charge;
    
    // Check if we have an orderId in metadata
    if (metadata?.orderId) {
      // Update existing order
      const order = await prisma.order.update({
        where: { id: metadata.orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: charge.payment_method_details?.type || 'stripe',
          paymentIntentId: charge.payment_intent?.toString() || null,
          chargeId: charge.id,
          statusUpdates: {
            create: {
              status: OrderStatus.CONFIRMED,
              note: 'Payment confirmed',
              updatedById: metadata.userId || 'system'
            }
          }
        }
      });
      
      console.log(`Updated order ${order.id} payment status to PAID`);
      return order;
    } else {
      // Create a new order if it doesn't exist
      console.log('No orderId found in metadata, creating new order from charge data');
      
      // Verify we have the necessary data
      if (!metadata?.userId) {
        console.error('Missing required userId in metadata');
        throw new Error('Missing required metadata: userId');
      }
      
      if (!metadata?.items) {
        console.error('Missing required items in metadata');
        throw new Error('Missing required metadata: items');
      }
      
      // Parse items from metadata
      let items = [];
      try {
        items = JSON.parse(metadata.items);
        console.log('Parsed items:', items);
      } catch (e) {
        console.error('Failed to parse items JSON:', e, 'Raw items string:', metadata.items);
        throw new Error('Invalid items format in metadata');
      }
      
      // Verify items structure
      if (!Array.isArray(items) || items.length === 0) {
        console.error('Items is not a valid array or is empty:', items);
        throw new Error('Invalid items format: not an array or empty');
      }
      
      // Fetch menu items to calculate prices
      const menuItemIds = items.map(item => item.menuItemId);
      console.log('Looking up menu items with IDs:', menuItemIds);
      
      const menuItems = await prisma.menuItem.findMany({
        where: { id: { in: menuItemIds } }
      });
      
      console.log(`Found ${menuItems.length} of ${menuItemIds.length} menu items`);
      
      if (menuItems.length === 0) {
        throw new Error('No menu items found with the provided IDs');
      }
      
      // Create order items with prices
      const orderItems = [];
      for (const item of items) {
        const menuItem = menuItems.find(mi => mi.id === item.menuItemId);
        if (!menuItem) {
          console.error(`Menu item not found: ${item.menuItemId}`);
          continue; // Skip this item but continue with others
        }
        
        orderItems.push({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          price: menuItem.price,
          specialInstructions: null
        });
      }
      
      if (orderItems.length === 0) {
        throw new Error('No valid order items could be created');
      }
      
      // Calculate total (convert from cents)
      const total = charge.amount / 100;
      
      // Get order type and transform to enum if needed
      let orderType: OrderType = OrderType.PICKUP; // Default
      if (metadata.orderType && Object.values(OrderType).includes(metadata.orderType as OrderType)) {
        orderType = metadata.orderType as OrderType;
      }
      
      // Parse pickup time if provided
      let pickupTime = null;
      if (metadata.pickupTime) {
        try {
          // Try to parse as ISO date first
          pickupTime = new Date(metadata.pickupTime);
          // If not a valid date or time string, handle gracefully
          if (isNaN(pickupTime.getTime())) {
            // Try to parse common time formats like "04:00 p.m."
            const today = new Date();
            const timeParts = metadata.pickupTime.match(/(\d+):(\d+)\s*(a\.m\.|p\.m\.|am|pm)/i);
            
            if (timeParts) {
              let [_, hours, minutes, period] = timeParts;
              let hour = parseInt(hours, 10);
              
              // Convert to 24-hour format
              if (period.toLowerCase().includes('p') && hour < 12) {
                hour += 12;
              } else if (period.toLowerCase().includes('a') && hour === 12) {
                hour = 0;
              }
              
              pickupTime = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                hour,
                parseInt(minutes, 10)
              );
            } else {
              pickupTime = null;
            }
          }
        } catch (error) {
          console.error('Error parsing pickup time:', error);
          pickupTime = null;
        }
      }
      
      console.log('Creating order with:', {
        userId: metadata.userId,
        total,
        items: orderItems.length,
        orderType,
        pickupTime: pickupTime ? pickupTime.toISOString() : null
      });
      
      // Create the order
      const order = await prisma.order.create({
        data: {
          userId: metadata.userId,
          total,
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: charge.payment_method_details?.type || 'stripe',
          paymentIntentId: charge.payment_intent?.toString() || null,
          chargeId: charge.id,
          orderType,
          orderNotes: metadata.orderNotes || null,
          estimatedPickupTime: pickupTime,
          items: {
            create: orderItems
          },
          statusUpdates: {
            create: {
              status: OrderStatus.CONFIRMED,
              note: 'Order created and payment confirmed via webhook',
              updatedById: metadata.userId
            }
          }
        }
      });
      
      console.log(`Created new order ${order.id} from charge ${charge.id}`);
      return order;
    }
  } catch (error) {
    console.error('Error processing charge.succeeded event:', error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;

  if (!metadata?.orderId) {
    console.error('No orderId in payment intent metadata');
    console.log("Payment intent metadata:", JSON.stringify(metadata));
    return;
  }

  console.log(`Processing successful payment intent for order: ${metadata.orderId}`);
  await updateOrderPaymentStatus(
    metadata.orderId,
    PaymentStatus.PAID,
    OrderStatus.CONFIRMED,
    metadata.userId || 'system',
    'Payment confirmed via payment intent',
    paymentIntent.id
  );
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;

  if (!metadata?.orderId) {
    console.error('No orderId in payment intent metadata');
    console.log("Payment intent metadata:", JSON.stringify(metadata));
    return;
  }

  console.log(`Processing failed payment intent for order: ${metadata.orderId}`);
  await updateOrderPaymentStatus(
    metadata.orderId,
    PaymentStatus.FAILED,
    OrderStatus.PENDING,
    metadata.userId || 'system',
    `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
  );
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { metadata } = session;

  if (!metadata?.orderId) {
    console.error('No orderId in checkout session metadata');
    console.log("Checkout session metadata:", JSON.stringify(metadata));
    return;
  }

  // If the session was paid, update the order
  if (session.payment_status === 'paid') {
    console.log(`Processing completed checkout session for order: ${metadata.orderId}`);
    await updateOrderPaymentStatus(
      metadata.orderId,
      PaymentStatus.PAID,
      OrderStatus.CONFIRMED,
      metadata.userId || 'system',
      'Payment confirmed through Stripe Checkout',
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
    );
  }
}

// Helper function to update order payment status
async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
  orderStatus: OrderStatus,
  updatedById: string,
  note?: string,
  paymentIntentId?: string,
  chargeId?: string
) {
  try {
    // First check if order exists
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    // Prepare update data
    const updateData: any = {
      paymentStatus,
      status: orderStatus,
      statusUpdates: {
        create: {
          status: orderStatus,
          note: note || `Payment status updated to ${paymentStatus}`,
          updatedById,
        },
      },
    };

    // Add payment IDs if provided
    if (paymentIntentId) {
      updateData.paymentIntentId = paymentIntentId;
    }
    
    if (chargeId) {
      updateData.chargeId = chargeId;
    }

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    console.log(`Order ${orderId} payment status updated to ${paymentStatus}`);
  } catch (error) {
    console.error(`Error updating order ${orderId} payment status:`, error);
  }
} 