# Stripe Integration Guide

This document provides a comprehensive guide on how Stripe is integrated with our Food Delivery Application.

## Table of Contents
1. [Order and Payment Flow](#order-and-payment-flow)
2. [Environment Variables](#environment-variables)
3. [Webhook Setup](#webhook-setup)
4. [Cart and Order Implementation](#cart-and-order-implementation)
5. [Discount and Promotion Handling](#discount-and-promotion-handling)
6. [Local Development Testing](#local-development-testing)
7. [Production Considerations](#production-considerations)
8. [Troubleshooting](#troubleshooting)

## Order and Payment Flow

Here's the complete flow for an order from creation to payment processing:

1. **Order Creation**
   - User adds items to cart (stored in browser cookies)
   - User proceeds to checkout
   - Application calls `createOrder` server action to create a new order in "PENDING" status
   - The order ID is stored for the next steps

2. **Payment Initiation**
   - Application creates a Stripe Checkout Session or Payment Intent
   - The order ID is included in the metadata of the payment
   - User is redirected to Stripe Checkout or shown a payment form

3. **Payment Processing**
   - User completes payment on Stripe
   - Stripe sends webhook events to our webhook endpoint

4. **Order Status Update**
   - Our webhook handler processes the event
   - If payment is successful, updates the order status to "CONFIRMED"
   - Order number is generated in format: `ORD-{timestamp}-{randomChars}`
   - If payment fails, updates the order status to "FAILED"

5. **Confirmation Page**
   - User is redirected to the confirmation page
   - Page fetches order details from `/api/orders/by-payment` using payment intent ID
   - Displays order number, pickup time, and other details
   - Provides a link to view complete order details

The key to this flow is that the order must be created in the database **before** the payment process starts, and the order ID must be included in the payment metadata. For webhooks that create orders directly from payment data, an order number is automatically generated.

## Order Number Generation

Order numbers are automatically generated in the following format:
```javascript
// Generate order number format: ORD-{timestamp}-{randomChars}
const timestamp = new Date().getTime().toString().slice(-6);
const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
const orderNumber = `ORD-${timestamp}-${randomChars}`;
```

This ensures:
- Human-readable format with "ORD" prefix
- Timestamp component for chronological ordering
- Random characters to prevent collisions
- Readable by customer service for order lookups

## Environment Variables

The following environment variables are required for Stripe integration:

```bash
# .env.local and production environment
STRIPE_SECRET_KEY=sk_live_your_live_key_here  # For production
STRIPE_SECRET_KEY=sk_test_your_test_key_here  # For development

STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key_here  # For production
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here  # For development

STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# For callbacks after payment
NEXT_PUBLIC_APP_URL=https://your-domain.com  # For production
NEXT_PUBLIC_APP_URL=http://localhost:3000  # For development
```

## Webhook Setup

### Getting Your Webhook Secret

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/) → Developers → Webhooks
2. Click "Add Endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhook/stripe`
4. Select the events you want to listen to (at minimum: `charge.succeeded`, `payment_intent.succeeded`, `payment_intent.payment_failed`)
5. Click "Add Endpoint"
6. Reveal the "Signing Secret" - this is your `STRIPE_WEBHOOK_SECRET`

### Adding to Your Environment

For production (e.g., on Vercel):
1. Go to your project settings
2. Navigate to Environment Variables
3. Add `STRIPE_WEBHOOK_SECRET` with the value from Stripe

## Discount and Promotion Handling

The application supports applying discounts and promotions to orders, which are tracked through the Stripe payment process and recorded in the sales table.

### Including Discount Information in Stripe Metadata

When processing a payment with Stripe, discount information is included in the payment metadata:

```javascript
// Example of creating a payment intent with discount metadata
const paymentIntent = await stripe.paymentIntents.create({
  amount: calculatedTotal * 100, // Total after discount, in cents
  currency: 'usd',
  metadata: {
    userId: userId,
    orderId: order.id,
    orderType: orderData.orderType,
    pickupTime: orderData.estimatedPickupTime,
    items: JSON.stringify(lineItems),
    discount: discountAmount, // Include discount amount in metadata
    promotionId: promotion?.id // Include promotion ID if available
  }
});
```

### Webhook Handling for Discounts

The webhook handler (`/api/webhook/stripe/route.ts`) processes discount information from Stripe events:

1. **Extracting Discount Data**: When a payment event is received, the webhook extracts discount information from the metadata:
   ```javascript
   // Extract discount from metadata if available
   const discount = metadata?.discount ? Number(metadata.discount) : 0;
   ```

2. **Recording in Sales Table**: The discount amount is saved in the `discount` field of the Sales record:
   ```javascript
   await createSaleFromPayment({
     subtotal: subtotal,
     tax: tax,
     total: amount,
     discount: discount, // Save discount amount in sales record
     paymentMethod: 'stripe',
     orderId: orderId,
     processedById: metadata?.userId || 'system',
     notes: `Payment processed via Stripe. ${discount > 0 ? `Discount applied: $${discount.toFixed(2)}` : ''}`
   });
   ```

3. **Consistent Handling**: This process works across all payment event types:
   - `charge.succeeded`: When a charge is processed directly
   - `payment_intent.succeeded`: When a payment intent completes successfully
   - `checkout.session.completed`: When a checkout session is completed

This ensures that any discounts applied during checkout are properly tracked in the sales system, allowing for accurate financial reporting.

## Cart and Order Implementation

### Cart Management

We use client-side cookies to manage the shopping cart:

```javascript
// lib/cookies.ts - Client-side cookie management
import { getCookie, setCookie } from '@/lib/cookies';

// Get the cart contents
const cartJson = getCookie('cart') || '[]';
const cart = JSON.parse(cartJson);

// Save cart updates
setCookie('cart', JSON.stringify(updatedCart));
```

### Order Creation

Orders are created using server actions before initiating payment:

```javascript
// lib/actions/order-actions.ts - Server-side order creation
export async function createOrder(
  userId: string,
  orderData: {
    total: number;
    orderType: OrderType;
    orderNotes?: string | null;
    items: Array<{
      menuItemId: string;
      quantity: number;
      price: number;
      specialInstructions?: string | null;
    }>;
  }
): Promise<OrderActionResult>
```

### Checkout Process

The checkout process ties everything together:

```javascript
// lib/actions/payment-actions.ts - Creating checkout sessions
export async function createCheckoutSession(
  userId: string,
  cart: CartItem[],
  orderData: {
    orderType: OrderType;
    orderNotes?: string;
  }
): Promise<CheckoutActionResult>
```

### Webhook Handling

Webhooks update the order status based on payment outcomes:

```javascript
// app/api/webhook/stripe/route.ts - Processing Stripe webhooks
export async function POST(req: NextRequest) {
  // Verify webhook signature
  // Process events (payment_intent.succeeded, etc.)
  // Update order status in database
}
```

## Local Development Testing

For testing webhook functionality during development:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Run the following commands:

```bash
# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhook/stripe
```

The CLI will provide a webhook secret for local testing. Add this to your `.env.local` file:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_local_testing_secret
```

### Testing the Complete Flow

1. Add items to cart
2. Proceed to checkout
3. Verify order is created in database with PENDING status
4. Complete test payment using test card (4242 4242 4242 4242)
5. Verify webhook updates order status to CONFIRMED

## Production Considerations

1. **Always use HTTPS** for your webhook endpoint
2. Set up proper **error monitoring** for your webhook handler
3. Implement **idempotency** to prevent duplicate processing (Stripe sends retries)
4. Consider adding **logging** for all webhook events for easier debugging
5. Ensure your database has the necessary indexes for order querying

## Troubleshooting

### Common Webhook Issues

1. **Signature Verification Failed**
   - Ensure your webhook secret is correct
   - Verify the raw request body is being used for verification
   - Check if any proxy or middleware is modifying the request

2. **Events Not Processing**
   - Check server logs for errors
   - Verify the events are being sent (Stripe Dashboard → Developers → Webhooks → Recent Events)
   - Ensure your handler supports the event types you're receiving

3. **Orders Not Being Updated**
   - Verify order IDs are correctly included in payment metadata
   - Check for database errors in your logs
   - Ensure your webhook handler has permissions to update the database

4. **Cart/Cookie Issues**
   - Check browser cookie settings (SameSite, Secure flags)
   - Verify cookie size limits aren't being exceeded
   - Use browser developer tools to inspect cookies

### Testing Payments

For testing payments without real transactions:

1. Use Stripe's test cards, e.g., `4242 4242 4242 4242` for successful payments
2. Set expiration date to any future date, CVC to any 3 digits
3. Use any name and address

### Support and Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Testing](https://stripe.com/docs/testing) 