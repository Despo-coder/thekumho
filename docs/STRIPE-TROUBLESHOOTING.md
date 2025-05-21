# Stripe Integration Troubleshooting Guide

This document provides solutions for common issues when working with the Stripe integration in this project.

## Environment Variables

The most common source of issues is incorrect environment variable setup.

### Required Variables

Make sure your `.env.local` file contains:

```
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_if_using_webhooks
```

### Common Error Messages

#### "Neither apiKey nor config.authenticator provided"

**Cause**: The application is trying to create a Stripe instance on the client side or the server-side environment variable is missing.

**Solution**:
1. Make sure your `.env.local` file contains the `STRIPE_SECRET_KEY` value
2. Restart your development server after adding environment variables
3. Confirm the variable is loaded by checking server logs during startup

#### "No such customer" or other Stripe API errors

**Cause**: Your Stripe API key is incorrect or your account doesn't have the right permissions.

**Solution**:
1. Verify your API keys in the Stripe Dashboard
2. Make sure you're using test keys for development
3. Confirm that your Stripe account is correctly set up

## Server-Side vs. Client-Side Code

The application is designed to keep Stripe's secret key secure by only using it on the server.

### Common Pitfalls

1. **Importing the wrong modules**: Make sure client components only import client-safe parts of the Stripe configuration

2. **Directly instantiating Stripe on the client**: This is prevented in the codebase but check for any instances where you might be trying to access the secret key on the client

## TypeScript and ESLint Issues

The codebase is set up with TypeScript and ESLint to ensure code quality and detect potential issues early.

### Common TypeScript Errors

#### "Unexpected any. Specify a different type."

**Cause**: The codebase enforces strict typing and avoids the use of `any` type.

**Solution**:
1. Use specific types when possible (e.g., `Stripe.PaymentIntent`)
2. Use `unknown` for variables with uncertain types, then add type guards
3. Create interfaces for complex objects

#### Example Type Guards:

```typescript
// For error handling
if (error instanceof Error) {
  console.error(error.message);
}

// For Stripe objects
const errorObj = stripError as Record<string, unknown>;
const errorCode = typeof errorObj.code === 'string' ? errorObj.code : undefined;
```

### React Component Issues

#### Unescaped Entity Warnings

**Cause**: React requires special characters like quotes and apostrophes to be escaped in JSX.

**Solution**:
- Replace `'` with `&apos;` or `&#39;`
- Replace `"` with `&quot;` or `&#34;`

#### Unused Variables

**Cause**: ESLint flags variables that are declared but not used.

**Solution**:
1. Remove unused variables
2. Rename variables with a leading underscore to indicate they're intentionally unused
3. Use destructuring to only pick required props

## Testing

### Test Credit Cards

For testing payments without using real cards:

- **Success**: 4242 4242 4242 4242
- **Authentication Required**: 4000 0025 0000 3155  
- **Decline**: 4000 0000 0000 9995

### Webhook Testing

1. Install the Stripe CLI: https://stripe.com/docs/stripe-cli
2. Run: `stripe login`
3. Start webhook forwarding: `stripe listen --forward-to localhost:3000/api/webhook/stripe`
4. The CLI will display a webhook signing secret - add this to your `.env.local` file

## Debugging

### Server-Side Logs

When developing, check your terminal running the Next.js server for:
- Payment intent creation logs
- Webhook processing logs
- Stripe initialization errors

### Client-Side Logs

Check your browser console for:
- Payment intent creation requests
- Form validation errors
- Stripe Elements initialization issues

## Common Integration Issues

### Payment Form Not Loading

**Possible causes**:
- Missing publishable key
- Error in Stripe Elements initialization
- React component mounting issues

**Solutions**:
1. Check browser console for errors
2. Verify the publishable key is correctly set
3. Make sure you're using `'use client'` directive in components using Stripe Elements

### Payment Processing Errors

**Possible causes**:
- Invalid payment details
- Stripe account restrictions
- Network issues

**Solutions**:
1. Try a different test card
2. Check Stripe Dashboard for declined payment details
3. Verify your account can process payments in test mode

## Getting Help

If you continue experiencing issues:

1. Check the [Stripe Documentation](https://stripe.com/docs)
2. Look for errors in both client and server logs
3. Verify all environment variables are correctly set
4. Ensure your Stripe account is properly configured

When seeking help, provide:
- Error messages (with sensitive information redacted)
- Steps to reproduce the issue
- Environment details (Next.js version, browser, etc.)
- Relevant code snippets 