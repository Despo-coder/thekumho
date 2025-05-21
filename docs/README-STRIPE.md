# Stripe Integration for Restaurant App

This application uses Stripe for processing online payments. Follow these steps to set up and test Stripe in your development environment.

## Setup

1. Create a Stripe account at [stripe.com](https://stripe.com) if you don't have one already.

2. Get your API keys from the Stripe Dashboard:
   - Go to [Developers > API keys](https://dashboard.stripe.com/apikeys)
   - Copy the **Publishable key** and **Secret key**

3. Create a `.env.local` file in the root directory of the project with the following variables:
   ```
   STRIPE_SECRET_KEY=sk_test_your_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_if_using_webhooks
   ```

4. For testing webhooks locally (optional but recommended):
   - Install [Stripe CLI](https://stripe.com/docs/stripe-cli)
   - Run `stripe login` to authenticate
   - Run `stripe listen --forward-to localhost:3000/api/webhook/stripe` to forward events to your local server
   - Copy the webhook signing secret that's displayed and add it to your `.env.local` file

## Implementation Details

The Stripe integration includes:

1. **Secure Configuration** (`/lib/stripe/config.ts`):
   - Client-side: Only exports the publishable key for the frontend
   - Server-side: Provides a function to access the Stripe instance only on the server
   - Prevents secret key exposure to the client

2. **Payment API Endpoint** (`/api/payment/route.ts`):
   - Creates a payment intent with the order amount and metadata
   - Requires authentication
   - Returns a client secret for the frontend
   - Implements proper TypeScript typing with enhanced error handling

3. **Webhook Endpoint** (`/api/webhook/stripe/route.ts`):
   - Handles asynchronous payment events (succeeded, failed)
   - Verifies webhook signatures for security
   - Updates order status based on payment events
   - Uses strong typing for Stripe event objects

4. **StripePaymentForm Component** (`/components/checkout/StripePaymentForm.tsx`):
   - Provides a wrapper for Stripe Elements
   - Handles payment submission and validation
   - Manages payment states and error display
   - Type-safe implementation with proper React patterns

5. **Checkout Page Integration**:
   - Offers both cash and card payment options
   - Creates a payment intent when user selects card payment
   - Displays Stripe Elements for completing payment
   - Handles payment success and failure

## TypeScript and Code Quality

The integration uses TypeScript for type safety and follows best practices:

1. **Strong Typing**:
   - Custom interfaces for all data structures
   - Proper type annotations for Stripe objects
   - No use of `any` type to prevent runtime errors

2. **Error Handling**:
   - Type-safe error handling using `unknown` and type guards
   - Proper error messages for debugging
   - Graceful fallbacks for error states

3. **React Best Practices**:
   - Proper component props typing
   - Escaped entity characters in JSX
   - No unused variables or props

## Testing

For testing payments, you can use Stripe's test card numbers:

- Successful payment: `4242 4242 4242 4242`
- Payment requires authentication: `4000 0025 0000 3155`
- Payment declined: `4000 0000 0000 9995`

Use any future expiration date, any 3-digit CVC, and any postal code when testing.

## Security Considerations

The integration follows these security best practices:

1. **Environment Variables**: Secret keys are only accessible on the server side
2. **Server-side Only**: The Stripe instance with the secret key is only initialized on the server
3. **Webhook Verification**: All webhook events are verified using signatures
4. **Type Safety**: TypeScript is used throughout for type safety
5. **Error Handling**: Robust error handling for payment processing

## Production Considerations

Before deploying to production:

1. Switch to production API keys in your environment variables
2. Set up proper webhook endpoints with appropriate security
3. Configure Stripe settings in the dashboard (account emails, branding, etc.)
4. Set up proper error handling and logging for payment failures
5. Consider implementing additional security measures like 3D Secure

## Troubleshooting

- **Payment fails**: Check the browser console and server logs for detailed error messages.
- **Webhook issues**: Make sure you're using the correct webhook secret and that your server is properly configured to receive webhooks.
- **API errors**: Verify your API keys and ensure your account has proper permissions.
- **"Neither apiKey nor config.authenticator provided"**: This means your environment variables are not set up correctly. Check your `.env.local` file.
- **TypeScript errors**: See the `STRIPE-TROUBLESHOOTING.md` file for common TypeScript and linting issues.

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe React Elements](https://stripe.com/docs/stripe-js/react)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) 