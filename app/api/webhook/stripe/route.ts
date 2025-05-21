import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// Initialize Stripe with the secret API key from environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

// Define the POST handler function for the Stripe webhook
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      console.error('Missing stripe-signature header in webhook request');
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    const testWebhookSecret = process.env.NODE_ENV === 'development' ? 'whsec_test_12345678901234567890123456789012' : '';

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        webhookSecret || testWebhookSecret
      );
      console.log(`Received Stripe webhook event: ${event.type}`);
    } catch (err: unknown) {
      const error = err as Error;
      console.error(`Webhook signature verification failed: ${error.message}`);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${error.message}` },
        { status: 400 }
      );
    }

    // Handle the event based on its type
    switch (event.type) {
      case 'charge.succeeded':
        await handleChargeSucceeded(event);
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

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error processing webhook:', err.message);
    return NextResponse.json(
      { error: 'Error processing webhook' },
      { status: 500 }
    );
  }
}

async function handleChargeSucceeded(event: Stripe.Event) {
  const charge = event.data.object as Stripe.Charge;

  if (!charge.metadata?.orderId) {
    console.error(`No orderId found in charge metadata: ${charge.id}`);
    return;
  }

  console.log(`Processing payment for order: ${charge.metadata.orderId}`);

  try {
    // Update order status
    await prisma.order.update({
      where: { id: charge.metadata.orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.CONFIRMED,
        statusUpdates: {
          create: {
            status: OrderStatus.CONFIRMED,
            note: 'Payment confirmed through Stripe',
            updatedById: charge.metadata.userId || 'system',
          },
        },
      },
    });

    console.log(`Order ${charge.metadata.orderId} marked as paid`);
  } catch (error) {
    console.error(`Error updating order ${charge.metadata.orderId}:`, error);
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;

  if (!metadata?.orderId) {
    console.error('No orderId in payment intent metadata');
    return;
  }

  try {
    // Update order status
    await prisma.order.update({
      where: { id: metadata.orderId },
      data: {
        paymentStatus: PaymentStatus.PAID,
        status: OrderStatus.CONFIRMED,
        statusUpdates: {
          create: {
            status: OrderStatus.CONFIRMED,
            note: 'Payment confirmed through Stripe',
            updatedById: metadata.userId || 'system',
          },
        },
      },
    });

    console.log(`Order ${metadata.orderId} marked as paid`);
  } catch (error) {
    console.error(`Error updating order ${metadata.orderId}:`, error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;

  if (!metadata?.orderId) {
    console.error('No orderId in payment intent metadata');
    return;
  }

  try {
    // Update order with failed payment status
    await prisma.order.update({
      where: { id: metadata.orderId },
      data: {
        paymentStatus: PaymentStatus.FAILED,
        statusUpdates: {
          create: {
            status: OrderStatus.PENDING,
            note: 'Payment failed: ' + (paymentIntent.last_payment_error?.message || 'Unknown error'),
            updatedById: 'system',
          },
        },
      },
    });

    console.log(`Order ${metadata.orderId} marked as payment failed`);
  } catch (error) {
    console.error(`Error updating order ${metadata.orderId} payment failed:`, error);
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const { metadata } = session;

  if (!metadata?.orderId) {
    console.error('No orderId in checkout session metadata');
    return;
  }

  try {
    // If the session was paid, update the order
    if (session.payment_status === 'paid') {
      await prisma.order.update({
        where: { id: metadata.orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.CONFIRMED,
          statusUpdates: {
            create: {
              status: OrderStatus.CONFIRMED,
              note: 'Payment confirmed through Stripe Checkout',
              updatedById: metadata.userId || 'system',
            },
          },
        },
      });

      console.log(`Order ${metadata.orderId} marked as paid via checkout`);
    }
  } catch (error) {
    console.error(`Error updating order ${metadata.orderId} after checkout:`, error);
  }
} 