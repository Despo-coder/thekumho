'use client';

import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement, AddressElement } from '@stripe/react-stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe/config';
import { Button } from '@/components/ui/button';
import { LoaderCircle } from 'lucide-react';

interface StripePaymentFormProps {
    clientSecret: string;
    onPaymentSuccess: () => void;
    onPaymentError: (error: string) => void;
}
// total
// Elements wrapper for the payment form
export function StripePaymentWrapper({
    clientSecret,
    onPaymentSuccess,
    onPaymentError,

}: StripePaymentFormProps & { total: number }) {
    if (!clientSecret) {
        return <div>Loading payment information...</div>;
    }

    return (
        <Elements
            stripe={stripePromise}
            options={{
                clientSecret,
                appearance: {
                    theme: 'stripe',
                    variables: {
                        colorPrimary: '#ea580c', // orange-600 to match theme
                        borderRadius: '6px',
                    },
                },
            }}
        >
            <StripePaymentForm
                clientSecret={clientSecret}
                onPaymentSuccess={onPaymentSuccess}
                onPaymentError={onPaymentError}
            />
        </Elements>
    );
}

// The actual payment form
function StripePaymentForm({
    onPaymentSuccess,
    onPaymentError,
}: StripePaymentFormProps) {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | undefined>();

    useEffect(() => {
        if (!stripe) {
            return;
        }

        // Check for errors from the URL (e.g., if user was redirected)
        const clientSecret = new URLSearchParams(window.location.search).get(
            'payment_intent_client_secret'
        );

        if (!clientSecret) {
            return;
        }

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            switch (paymentIntent?.status) {
                case 'succeeded':
                    onPaymentSuccess();
                    break;
                case 'processing':
                    setErrorMessage('Your payment is processing.');
                    break;
                case 'requires_payment_method':
                    setErrorMessage('Your payment was not successful, please try again.');
                    break;
                default:
                    setErrorMessage('Something went wrong.');
                    break;
            }
        });
    }, [stripe, onPaymentSuccess]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            return;
        }

        setIsLoading(true);
        setErrorMessage(undefined);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/checkout/confirmation`,
            },
        });

        // If error.type is "card_error" or "validation_error", show the message
        if (error) {
            setErrorMessage(error.message);
            onPaymentError(error.message || 'An unexpected error occurred');
        } else {
            // Otherwise assume the payment succeeded
            onPaymentSuccess();
        }

        setIsLoading(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <PaymentElement id="payment-element" options={{ layout: 'tabs' }} />
                <AddressElement
                    options={{
                        mode: 'shipping',
                        defaultValues: {
                            name: '',
                        },
                        fields: {
                            phone: 'always',
                        },
                    }}
                />
            </div>

            {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                    {errorMessage}
                </div>
            )}

            <Button
                type="submit"
                disabled={isLoading || !stripe || !elements}
                className={`w-full bg-orange-600 hover:bg-orange-700 py-3 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center">
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </span>
                ) : (
                    <span>Pay Now</span>
                )}
            </Button>
        </form>
    );
} 