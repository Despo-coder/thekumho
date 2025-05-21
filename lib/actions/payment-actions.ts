'use server';

import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { createOrder } from '@/lib/actions/order-actions';
import { OrderType } from '@prisma/client';

// Define CartItem type inline
type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  specialInstructions?: string | null;
};

// Initialize Stripe with the secret API key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

type CheckoutActionResult = {
  success: boolean;
  url?: string;
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
    const total = cart.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);

    // First create the order in our database
    const orderResult = await createOrder(userId, {
      total,
      orderType: orderData.orderType,
      orderNotes: orderData.orderNotes,
      items: cart.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: Number(item.price),
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