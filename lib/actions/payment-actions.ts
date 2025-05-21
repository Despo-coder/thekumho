'use server';

import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { createOrder } from '@/lib/actions/order-actions';
import { OrderType } from '@prisma/client';
import { getStripeInstance } from "@/lib/stripe/config";

// Define CartItem type inline
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  specialInstructions?: string | null;
  menuItemId: string;
};

// Initialize Stripe with the secret API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type CheckoutActionResult = {
  success: boolean;
  url?: string;
  error?: string;
};

type CheckoutData = {
  orderType: OrderType;
  orderNotes?: string;
  pickupTime?: string;
};

type PaymentResult = {
  success: boolean;
  clientSecret?: string | null;
  orderId?: string;
  error?: string;
};

/**
 * Creates a checkout session for the user's cart
 * 
 * @param userId The user's ID
 * @param cart The user's cart items
 * @param orderData Additional order data (notes, type, etc.)
 * @returns A URL to redirect to or an error message
 */
export async function createCheckoutSession(
  userId: string,
  cart: CartItem[],
  orderData: {
    orderType: OrderType;
    orderNotes?: string;
  }
): Promise<CheckoutActionResult> {
  try {
    if (!userId) {
      return { success: false, error: 'User must be logged in to checkout' };
    }

    if (!cart.length) {
      return { success: false, error: 'Cart is empty' };
    }

    // Calculate the total price
    // const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    // First create the order in our database
    const orderResult = await createOrder(userId, {
      orderType: orderData.orderType,
      orderNotes: orderData.orderNotes,
      items: cart.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      }))
    });

    if (!orderResult.success || !orderResult.orderId) {
      return { success: false, error: orderResult.error || 'Failed to create order' };
    }

    // Get a reference to the created order
    const order = await prisma.order.findUnique({
      where: { id: orderResult.orderId },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    if (!order) {
      return { success: false, error: 'Failed to retrieve created order' };
    }

    // Create the Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: order.items.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.menuItem.name,
            images: item.menuItem.image ? [item.menuItem.image] : [],
          },
          unit_amount: Math.round(Number(item.price) * 100), // Convert to cents
        },
        quantity: item.quantity,
      })),
      metadata: {
        orderId: order.id,
        userId: userId,
        orderType: order.orderType
      },
      customer_email: (await prisma.user.findUnique({ where: { id: userId } }))?.email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?canceled=true`,
    });

    // Note: Cart clearing should be handled by the client after successful redirect
    return { success: true, url: session.url || undefined };
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error creating checkout session:', err);
    return {
      success: false,
      error: err.message || 'An error occurred during checkout'
    };
  }
}

/**
 * Redirects to Stripe checkout
 * Used as a wrapper for form submissions
 */
export async function redirectToCheckout(
  userId: string,
  cart: CartItem[],
  formData: FormData
): Promise<never> {
  const orderNotes = formData.get('orderNotes') as string;
  const orderType = formData.get('orderType') as OrderType;

  const result = await createCheckoutSession(userId, cart, {
    orderType,
    orderNotes
  });

  if (!result.success || !result.url) {
    // If there's an error, redirect to checkout with error message
    const searchParams = new URLSearchParams();
    searchParams.set('error', result.error || 'Failed to create checkout session');
    redirect(`/checkout?${searchParams.toString()}`);
  }

  // Redirect to Stripe checkout
  redirect(result.url);
}

/**
 * Creates a payment intent for an order
 * This function:
 * 1. Creates the order in the database
 * 2. Creates a Stripe payment intent for the order
 * 3. Returns the client secret for frontend payment processing
 */
export async function createPaymentIntent(
  userId: string,
  cart: CartItem[],
  checkoutData: CheckoutData
): Promise<PaymentResult> {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }
    
    if (!cart || cart.length === 0) {
      return { success: false, error: "Cart cannot be empty" };
    }

    // Step 1: Create order in database first
    const orderResult = await createOrder(userId, {
      items: cart.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        specialInstructions: item.specialInstructions
      })),
      orderType: checkoutData.orderType,
      orderNotes: checkoutData.orderNotes,
      pickupTime: checkoutData.pickupTime
    });

    if (!orderResult.success || !orderResult.orderId) {
      return { success: false, error: orderResult.error || "Failed to create order" };
    }

    // Step 2: Fetch the created order to get total
    const orderData = await prisma.order.findUnique({
      where: { id: orderResult.orderId },
      include: {
        items: {
          include: {
            menuItem: true
          }
        }
      }
    });

    if (!orderData) {
      return { success: false, error: "Created order not found" };
    }

    // Step 3: Create Stripe payment intent
    const stripe = getStripeInstance();
    if (!stripe) {
      return { success: false, error: "Stripe configuration error" };
    }

    // Calculate amount in cents for Stripe
    const amount = Math.round(Number(orderData.total) * 100);
    
    // Create a payment intent with orderId in metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        orderId: orderResult.orderId,
        userId,
        orderType: checkoutData.orderType,
        pickupTime: checkoutData.pickupTime || "",
        // Include other relevant metadata
      }
    });

    console.log(`Created payment intent for order ${orderResult.orderId}: ${paymentIntent.id}`);

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      orderId: orderResult.orderId
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create payment intent"
    };
  }
} 