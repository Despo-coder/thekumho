import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Environment variables
const NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Check if publishable key is present
if (!NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.warn('Missing Stripe publishable key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY). Payment functionality may not work correctly.');
} else {
  // We don't want to log the actual key, just that it exists
  console.log('Stripe publishable key found:', 
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(0, 8) + '...' + 
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.substring(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.length - 4)
  );
}

// Client side Stripe promise
export const stripePromise = loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Server side Stripe instance - only create on the server
// This prevents exposing the secret key to the client
let stripe: Stripe | null = null;

// This function should only be called on the server
export function getStripeInstance() {
  // Safety check for client-side execution
  if (typeof window !== 'undefined') {
    console.error('Security issue: Attempted to initialize Stripe server instance on the client side');
    return null;
  }

  // Return existing instance if already created
  if (stripe) {
    return stripe;
  }

  // Get secret key from environment
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  
  // Validate secret key
  if (!STRIPE_SECRET_KEY) {
    console.error('Missing Stripe secret key (STRIPE_SECRET_KEY). Check your environment variables.');
    console.log('Environment variables available:', Object.keys(process.env)
      .filter(key => key.includes('STRIPE') || key.includes('NEXT'))
      .join(', '));
    return null;
  }

  // Log that we're initializing (but don't log the key itself)
  console.log('Initializing Stripe server instance with key:', 
    STRIPE_SECRET_KEY.substring(0, 8) + '...' + 
    STRIPE_SECRET_KEY.substring(STRIPE_SECRET_KEY.length - 4)
  );
  
  try {
    // Create Stripe instance
    stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2025-04-30.basil',
    });
    console.log('Stripe server instance initialized successfully');
    return stripe;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return null;
  }
} 