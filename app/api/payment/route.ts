import { NextRequest, NextResponse } from 'next/server';
import { getStripeInstance } from '@/lib/stripe/config';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
// import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  console.log("Payment API route called");
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is authenticated
    if (!session) {
      console.log("Authentication required - no session found");
      return NextResponse.json(
        { error: 'Authentication required', message: 'You must be logged in to create a payment' },
        { status: 401 }
      );
    }

    console.log("User authenticated:", session.user.id);

    // Get Stripe instance
    const stripe = getStripeInstance();
    if (!stripe) {
      console.error('Stripe instance creation failed - check environment variables');
      return NextResponse.json(
        { error: 'Stripe configuration error', message: 'Server configuration error with payment provider' },
        { status: 500 }
      );
    }

    console.log("Stripe instance created successfully");

    // Get request data
    let body;
    try {
      body = await request.json();
      console.log("Request body parsed:", body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json(
        { error: 'Invalid request', message: 'Could not parse request body' },
        { status: 400 }
      );
    }
    
    const { amount, metadata } = body;
    
    // Log received data for debugging
    console.log('Received payment request:', { amount, userId: session.user.id, metadata });
    
    // Validate amount
    if (!amount) {
      console.log("Missing amount in request");
      return NextResponse.json(
        { error: 'Missing amount', message: 'Payment amount is required' },
        { status: 400 }
      );
    }
    
    // Check for minimum amount (Stripe requires at least $0.50)
    if (amount < 0.5) {
      console.log("Amount too small:", amount);
      return NextResponse.json(
        { error: 'Invalid amount', message: 'Minimum payment amount is $0.50' },
        { status: 400 }
      );
    }

    try {
      // Convert amount to cents for Stripe
      const amountInCents = Math.round(amount * 100);
      console.log("Creating payment intent with amount:", amountInCents, "cents");

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents, // Convert to cents
        currency: 'usd',
        metadata: {
          userId: session.user.id,
          ...(metadata || {})
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      console.log('Payment intent created successfully:', paymentIntent.id);

      // Return client secret
      return NextResponse.json({ clientSecret: paymentIntent.client_secret });
    } catch (stripeError: unknown) {
      // Type guard to extract error information safely
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Unknown error';
      
      // Safe access to possible Stripe error properties
      const stripeErrorObj = stripeError as Record<string, unknown>;
      const errorType = typeof stripeErrorObj.type === 'string' ? stripeErrorObj.type : undefined;
      const errorCode = typeof stripeErrorObj.code === 'string' ? stripeErrorObj.code : undefined;
      const errorParam = typeof stripeErrorObj.param === 'string' ? stripeErrorObj.param : undefined;
      
      console.error('Stripe API error:', errorType, errorMessage, errorCode);
      if (errorParam) {
        console.error('Stripe error parameter:', errorParam);
      }
      
      return NextResponse.json(
        { 
          error: 'Stripe API error', 
          message: errorMessage || 'Error creating payment intent',
          code: errorCode || 'unknown_error' 
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error && process.env.NODE_ENV !== 'production' 
      ? error.stack 
      : undefined;
    
    console.error('Payment intent creation error:', error);
    return NextResponse.json(
      { 
        error: 'Server error', 
        message: errorMessage || 'Failed to create payment intent',
        stack: errorStack
      },
      { status: 500 }
    );
  }
} 