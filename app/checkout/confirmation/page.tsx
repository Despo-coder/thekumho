"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart/CartContext';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Home, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConfirmationPage() {
    const searchParams = useSearchParams();
    const { clearCart } = useCart();
    const [status, setStatus] = useState<'success' | 'processing' | 'error'>('processing');
    const [orderNumber, setOrderNumber] = useState<string>('');
    const [mounted, setMounted] = useState(false);

    // Check payment status from URL
    useEffect(() => {
        setMounted(true);

        // Get the payment intent client secret and status from the URL
        const paymentIntentStatus = searchParams.get('redirect_status');

        // Generate a random order number for demo purposes
        // In a real app, this would come from your backend
        setOrderNumber(`ORD-${Math.floor(100000 + Math.random() * 900000)}`);

        if (paymentIntentStatus === 'succeeded') {
            setStatus('success');
            // Clear the cart after successful payment
            clearCart();
        } else if (paymentIntentStatus === 'processing') {
            setStatus('processing');
        } else {
            setStatus('error');
        }
    }, [searchParams, clearCart]);

    if (!mounted) {
        return <div className="container mx-auto py-12 px-4">Loading...</div>;
    }

    return (
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg mx-auto">
                {status === 'success' && (
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold mb-4">Payment Successful!</h1>
                        <p className="text-gray-600 mb-6">
                            Thank you for your order. We&apos;ve received your payment and are preparing your food.
                        </p>
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6 text-left">
                            <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
                                <span className="text-gray-600">Order Number:</span>
                                <span className="font-medium">{orderNumber}</span>
                            </div>
                            <div className="space-y-2">
                                <p className="text-gray-600">
                                    A confirmation email has been sent to your email address.
                                </p>
                                <p className="text-gray-600">
                                    Your order will be ready for pickup at your selected time.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {status === 'processing' && (
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mb-6">
                            <AlertCircle className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h1 className="text-2xl font-bold mb-4">Payment Processing</h1>
                        <p className="text-gray-600 mb-6">
                            Your payment is being processed. Please do not close this window. This may take a moment.
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-6">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold mb-4">Payment Failed</h1>
                        <p className="text-gray-600 mb-6">
                            Something went wrong with your payment. Please try again or contact our support team.
                        </p>
                        <Link href="/checkout">
                            <Button variant="outline" className="w-full mb-4">
                                Try Again
                            </Button>
                        </Link>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    <Link href="/">
                        <Button variant="outline" className="flex items-center gap-2 w-full">
                            <Home className="h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                    <Link href="/menu">
                        <Button className="bg-orange-600 hover:bg-orange-700 flex items-center gap-2 w-full">
                            <Utensils className="h-4 w-4" />
                            Order Again
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
} 