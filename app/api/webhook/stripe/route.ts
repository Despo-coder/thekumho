import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { OrderStatus, PaymentStatus, OrderType } from '@prisma/client';
import { createSaleFromPayment } from '@/lib/actions/sales-actions';

// Initialize Stripe with the secret API key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Define a type for webhook handler results
type WebhookResult = {
  success?: boolean;
  processed?: boolean;
  error?: string;
  order?: unknown;
};

// Define a type for order update data
// type OrderUpdateData = {
//   status?: OrderStatus;
//   paymentStatus: PaymentStatus;
//   paymentMethod: string;
//   paymentIntentId?: string | null;
//   chargeId?: string | null;
//   statusUpdates: {
//     create: {
//       status: OrderStatus;
//       note: string;
//       updatedById: string;
//     }
//   }
// };

// Define a type for order creation data
// type OrderCreateData = {
//   userId: string;
//   total: number;
//   status: OrderStatus;
//   paymentStatus: PaymentStatus;
//   paymentMethod: string;
//   paymentIntentId?: string | null;
//   chargeId?: string | null;
//   orderType: OrderType;
//   orderNotes: string | null;
//   estimatedPickupTime: Date | null;
//   items: {
//     create: Array<{
//       menuItemId: string;
//       quantity: number;
//       price: unknown; // Using unknown since Decimal type is used
//       specialInstructions: string | null;
//     }>
//   };
//   statusUpdates: {
//     create: {
//       status: OrderStatus;
//       note: string;
//       updatedById: string;
//     }
//   }
// };

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
      console.log('Using webhook secret:', webhookSecret ? 'Production' : testWebhookSecret ? 'Test' : 'None');
      
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
      console.error('Signature received:', signature);
      console.error('Error stack:', error.stack);
      
      // Return a 400 error to tell Stripe to retry the webhook
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      );
    }

    // Handle the event based on its type
    try {
      console.log(`Processing event ${event.id} of type ${event.type}`);
      
      let result: WebhookResult | unknown;
      switch (event.type) {
        case 'charge.succeeded':
          result = await handleChargeSucceeded(event.data.object as Stripe.Charge);
          console.log('Charge succeeded result:', JSON.stringify(result));
          break;
        case 'payment_intent.succeeded':
          result = await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          console.log('Payment intent succeeded result:', JSON.stringify(result));
          break;
        case 'payment_intent.payment_failed':
          result = await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          console.log('Payment intent failed result:', JSON.stringify(result));
          break;
        case 'checkout.session.completed':
          result = await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          console.log('Checkout session completed result:', JSON.stringify(result));
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      // Check if we got a result with error but processed flag
      if (result && 
          typeof result === 'object' && 
          'processed' in result && 
          'success' in result && 
          !result.success) {
        console.log(`Event ${event.id} processed with errors but acknowledged`);
        return NextResponse.json(
          { 
            received: true, 
            type: event.type, 
            warning: 'error' in result ? result.error as string : "Event processed with errors" 
          },
          { status: 200 }
        );
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Error handling ${event.type} event:`, error);
      console.error("Error stack:", error.stack);
      // Log detailed info about the event for debugging
      console.error("Event details:", JSON.stringify({
        id: event.id,
        type: event.type,
        created: event.created,
        data: {
          object: {
            type: event.data.object.object,
            summary: `${event.type} event`
          }
        }
      }));
      
      // Return 200 so Stripe doesn't retry - we've logged the error and can investigate
      return NextResponse.json(
        { received: true, type: event.type, warning: "Event processed with errors" },
        { status: 200 }
      );
    }

    // Return a 200 success response to acknowledge receipt of the event
    console.log(`Successfully processed ${event.type} event ${event.id}`);
    return NextResponse.json({ received: true, type: event.type, success: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error processing webhook:', err.message);
    console.error('Error stack:', err.stack);
    
    // Log all request headers for debugging
    console.error('Request headers:', JSON.stringify(Object.fromEntries(
      [...req.headers.entries()].map(([key, value]) => [key, value])
    )));
    
    return NextResponse.json(
      { error: 'Error processing webhook', message: err.message },
      { status: 500 }
    );
  }
}

const handleChargeSucceeded = async (charge: Stripe.Charge) => {
  try {
    console.log('Processing charge.succeeded event:', charge.id);
    console.log('Charge metadata:', JSON.stringify(charge.metadata || {}));
    
    const { metadata } = charge;
    let orderId: string | null = null;
    let order;
    
    // Check if we have an orderId in metadata
    if (metadata?.orderId) {
      // Update existing order
      try {
        // Get the existing order to check if it has an order number
        const existingOrder = await prisma.order.findUnique({
          where: { id: metadata.orderId }
        });
        
        if (!existingOrder) {
          throw new Error(`Order ${metadata.orderId} not found`);
        }
        
        // Generate order number if needed
        let orderNumber = existingOrder.orderNumber;
        if (!orderNumber) {
          const timestamp = new Date().getTime().toString().slice(-6);
          const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
          orderNumber = `ORD-${timestamp}-${randomChars}`;
        }
        
        // Prepare update data with only fields we know exist in schema
        const updateData = {
          orderNumber,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: charge.payment_method_details?.type || 'stripe',
          statusUpdates: {
            create: {
              status: OrderStatus.CONFIRMED,
              note: 'Payment confirmed',
              updatedById: metadata.userId || 'system'
            }
          }
        };
        
        // Only add these fields if the database schema has been updated
        try {
          // Test if we can update with new fields
          order = await prisma.order.update({
            where: { id: metadata.orderId },
            data: {
              ...updateData,
              paymentIntentId: charge.payment_intent?.toString() || null,
              chargeId: charge.id
            }
          });
          
          console.log(`Updated order ${order.id} payment status to PAID`);
          orderId = order.id;
        } catch (schemaError) {
          console.log('Schema might not be updated yet, using fallback update:', schemaError);
          
          // Fallback to basic update without new fields
          order = await prisma.order.update({
            where: { id: metadata.orderId },
            data: updateData
          });
          
          console.log(`Updated order ${order.id} payment status to PAID (fallback method)`);
          orderId = order.id;
        }
      } catch (updateError) {
        console.error('Error updating existing order:', updateError);
        throw updateError;
      }
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
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const [matchStr, hours, minutes, period] = timeParts;
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
      
      // Create the order with try/catch for schema compatibility
      try {
        // Generate order number - current format: ORD-{timestamp}-{random chars}
        const timestamp = new Date().getTime().toString().slice(-6);
        const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
        const orderNumber = `ORD-${timestamp}-${randomChars}`;
        
        // Prepare base order data
        const orderData = {
          userId: metadata.userId,
          orderNumber,
          total,
          status: OrderStatus.CONFIRMED,
          paymentStatus: PaymentStatus.PAID,
          paymentMethod: charge.payment_method_details?.type || 'stripe',
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
        };
        
        // Try to create with payment fields
        try {
          const order = await prisma.order.create({
            data: {
              ...orderData,
              paymentIntentId: charge.payment_intent?.toString() || null,
              chargeId: charge.id
            }
          });
          
          console.log(`Created new order ${order.id} from charge ${charge.id}`);
          orderId = order.id;
        } catch (schemaError) {
          console.log('Schema might not include payment fields, using fallback:', schemaError);
          
          // Fallback without payment fields
          const order = await prisma.order.create({
            data: orderData
          });
          
          console.log(`Created new order ${order.id} from charge ${charge.id} (fallback method)`);
          orderId = order.id;
        }
      } catch (createError) {
        console.error('Error creating order:', createError);
        throw createError;
      }
    }
    
    // Create a sales record if we have an order ID
    if (orderId) {
      try {
        // Calculate tax as 7% of total
        const amount = Number(charge.amount) / 100; // Convert from cents
        const taxRate = 0.07;
        const subtotal = amount / (1 + taxRate);
        const tax = amount - subtotal;
        
        // Extract discount from metadata if available
        const discount = metadata?.discount ? Number(metadata.discount) : 0;
        
        // Create the sales record
        await createSaleFromPayment({
          subtotal: subtotal,
          tax: tax,
          total: amount,
          discount: discount,
          paymentMethod: charge.payment_method_details?.type || 'stripe',
          orderId: orderId,
          processedById: metadata?.userId || 'system',
          notes: `Payment processed via Stripe. Charge ID: ${charge.id}${discount > 0 ? `. Discount applied: $${discount.toFixed(2)}` : ''}`
        });
        
        console.log(`Created sales record for order ${orderId}${discount > 0 ? ` with discount: $${discount.toFixed(2)}` : ''}`);
        
        // Create promotion usage tracking record if promotion was used
        if (metadata?.promotionId && discount > 0) {
          try {
            // Calculate total quantity of items in cart
            let totalItemCount = null;
            if (metadata.items) {
              try {
                const items = JSON.parse(metadata.items);
                totalItemCount = items.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0);
              } catch (e) {
                console.error('Error parsing items for cart count:', e);
              }
            }
            
            await createPromotionUsageRecord({
              promotionId: metadata.promotionId,
              userId: metadata.userId || 'system',
              orderId: orderId,
              discountAmount: discount,
              originalAmount: amount + discount,
              finalAmount: amount,
              couponCode: metadata.couponCode || null,
              orderType: metadata.orderType || 'PICKUP',
              cartItemCount: totalItemCount,
              chargeId: charge.id
            });
            
            console.log(`Created promotion usage record for promotion ${metadata.promotionId} (charge succeeded)`);
          } catch (promotionError) {
            console.error('Error creating promotion usage record (charge succeeded):', promotionError);
          }
        }
      } catch (saleError) {
        // Log but don't fail the webhook
        console.error('Error creating sales record:', saleError);
      }
    }
    
    return order;
  } catch (error) {
    console.error('Error processing charge.succeeded event:', error);
    // Instead of throwing, return a partial success so Stripe doesn't retry
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      processed: true // Indicate we handled it even with error
    };
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
  const result = await updateOrderPaymentStatus(
    metadata.orderId,
    PaymentStatus.PAID,
    OrderStatus.CONFIRMED,
    metadata.userId || 'system',
    'Payment confirmed via payment intent',
    paymentIntent.id
  );
  
  // If the order was updated successfully, create a sales record
  if (result?.success && paymentIntent.amount) {
    try {
      // Calculate tax as 7% of total
      const amount = Number(paymentIntent.amount) / 100; // Convert from cents
      const taxRate = 0.07;
      const subtotal = amount / (1 + taxRate);
      const tax = amount - subtotal;
      
      // Extract discount from metadata if available
      const discount = metadata?.discount ? Number(metadata.discount) : 0;
      
      // Create the sales record
      await createSaleFromPayment({
        subtotal: subtotal,
        tax: tax,
        total: amount,
        discount: discount,
        paymentMethod: typeof paymentIntent.payment_method === 'string' ? 
          paymentIntent.payment_method : 'stripe',
        orderId: metadata.orderId,
        processedById: metadata.userId || 'system',
        notes: `Payment intent processed via Stripe. Intent ID: ${paymentIntent.id}${discount > 0 ? `. Discount applied: $${discount.toFixed(2)}` : ''}`
      });
      
      console.log(`Created sales record for payment intent ${paymentIntent.id}${discount > 0 ? ` with discount: $${discount.toFixed(2)}` : ''}`);
      
      // Create promotion usage tracking record if promotion was used
      if (metadata?.promotionId && discount > 0) {
        try {
          // Calculate total quantity of items in cart
          let totalItemCount = null;
          if (metadata.items) {
            try {
              const items = JSON.parse(metadata.items);
              totalItemCount = items.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0);
            } catch (e) {
              console.error('Error parsing items for cart count:', e);
            }
          }
          
          await createPromotionUsageRecord({
            promotionId: metadata.promotionId,
            userId: metadata.userId || 'system',
            orderId: metadata.orderId,
            discountAmount: discount,
            originalAmount: amount + discount,
            finalAmount: amount,
            couponCode: metadata.couponCode || null,
            orderType: metadata.orderType || 'PICKUP',
            cartItemCount: totalItemCount,
            chargeId: paymentIntent.id
          });
          
          console.log(`Created promotion usage record for promotion ${metadata.promotionId} (payment intent)`);
        } catch (promotionError) {
          console.error('Error creating promotion usage record (payment intent):', promotionError);
        }
      }
    } catch (error) {
      // Log but don't fail the webhook
      console.error('Error creating sales record from payment intent:', error);
    }
  }
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
    const result = await updateOrderPaymentStatus(
      metadata.orderId,
      PaymentStatus.PAID,
      OrderStatus.CONFIRMED,
      metadata.userId || 'system',
      'Payment confirmed through Stripe Checkout',
      typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
    );
    
    // Create a sales record if there's payment data
    if (result?.success && session.amount_total) {
      try {
        // Calculate tax as 7% of total
        const amount = Number(session.amount_total) / 100; // Convert from cents
        const taxRate = 0.07;
        const subtotal = amount / (1 + taxRate);
        const tax = amount - subtotal;
        
        // Extract discount from metadata if available
        const discount = metadata?.discount ? Number(metadata.discount) : 0;
        
        // Create the sales record
        await createSaleFromPayment({
          subtotal: subtotal,
          tax: tax,
          total: amount,
          discount: discount,
          paymentMethod: 'stripe-checkout',
          orderId: metadata.orderId,
          processedById: metadata.userId || 'system',
          notes: `Payment processed via Stripe Checkout. Session ID: ${session.id}${discount > 0 ? `. Discount applied: $${discount.toFixed(2)}` : ''}`
        });
        
        console.log(`Created sales record for checkout session ${session.id}${discount > 0 ? ` with discount: $${discount.toFixed(2)}` : ''}`);
        
        // Create promotion usage tracking record if promotion was used
        if (metadata?.promotionId && discount > 0) {
          try {
            // Calculate total quantity of items in cart
            let totalItemCount = null;
            if (metadata.items) {
              try {
                const items = JSON.parse(metadata.items);
                totalItemCount = items.reduce((total: number, item: { quantity: number }) => total + item.quantity, 0);
              } catch (e) {
                console.error('Error parsing items for cart count:', e);
              }
            }
            
            await createPromotionUsageRecord({
              promotionId: metadata.promotionId,
              userId: metadata.userId || 'system',
              orderId: metadata.orderId,
              discountAmount: discount,
              originalAmount: amount + discount,
              finalAmount: amount,
              couponCode: metadata.couponCode || null,
              orderType: metadata.orderType || 'PICKUP',
              cartItemCount: totalItemCount,
              chargeId: session.id
            });
            
            console.log(`Created promotion usage record for promotion ${metadata.promotionId} (checkout session)`);
          } catch (promotionError) {
            console.error('Error creating promotion usage record (checkout session):', promotionError);
          }
        }
      } catch (error) {
        // Log but don't fail the webhook
        console.error('Error creating sales record from checkout session:', error);
      }
    }
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
      return { success: false, error: 'Order not found' };
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
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
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    console.log(`Order ${orderId} payment status updated to ${paymentStatus}`);
    return { success: true, order: updatedOrder };
  } catch (error) {
    console.error(`Error updating order ${orderId} payment status:`, error);
    return { success: false, error: 'Failed to update order status' };
  }
}

// Function to create promotion usage tracking record
async function createPromotionUsageRecord({
  promotionId,
  userId,
  orderId,
  discountAmount,
  originalAmount,
  finalAmount,
  couponCode,
  orderType,
  cartItemCount,
  // chargeId
}: {
  promotionId: string;
  userId: string;
  orderId: string;
  discountAmount: number;
  originalAmount: number;
  finalAmount: number;
  couponCode?: string | null;
  orderType?: string;
  cartItemCount?: number | null;
  chargeId: string;
}) {
  try {
    // Check if this is the user's first time using any promotion
    const existingUsage = await prisma.promotionUsage.findFirst({
      where: { userId }
    });
    const isFirstTimeUse = !existingUsage;
    
    // Calculate time to conversion (minutes from promotion start to use)
    const promotion = await prisma.promotion.findUnique({
      where: { id: promotionId },
      select: { startDate: true }
    });
    
    const timeToConversion = promotion ? 
      Math.floor((new Date().getTime() - new Date(promotion.startDate).getTime()) / (1000 * 60)) : null;
    
    // Determine customer segment based on order history
    const userOrderCount = await prisma.order.count({
      where: { userId }
    });
    
    let customerSegment = 'new';
    if (userOrderCount > 10) customerSegment = 'vip';
    else if (userOrderCount > 1) customerSegment = 'returning';
    
    // Create the usage record
    const usageRecord = await prisma.promotionUsage.create({
      data: {
        promotionId,
        userId,
        orderId,
        discountAmount,
        originalAmount,
        finalAmount,
        couponCode,
        customerSegment,
        orderType: orderType && Object.values(OrderType).includes(orderType as OrderType) 
          ? orderType as OrderType 
          : OrderType.PICKUP,
        isFirstTimeUse,
        timeToConversion,
        cartItemCount,
        // Additional metadata could be added here:
        // deviceType, referralSource, etc.
      }
    });
    
    return usageRecord;
  } catch (error) {
    console.error('Error in createPromotionUsageRecord:', error);
    throw error;
  }
} 