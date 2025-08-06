"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/lib/cart/CartContext';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, Home, Utensils, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

//import { useSession } from 'next-auth/react';
// import { format } from 'date-fns';

type OrderDetails = {
    orderNumber: string;
    id: string;
    total: number;
    pickupTime: string | null;
    status: string;
    items: Array<{
        name: string;
        quantity: number;
    }>;
};

function ConfirmationContent() {
    const searchParams = useSearchParams();
    const { clearCart } = useCart();
    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'waiting'>('loading');
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [mounted, setMounted] = useState(false);
    // const { data: session } = useSession();
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrderWithRetry = async (paymentIntentId: string, maxRetries = 3, delay = 1000) => {
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const response = await fetch(`/api/orders/by-payment?paymentIntentId=${paymentIntentId}`);

                if (response.ok) {
                    return await response.json();
                }

                // If not found, wait and retry
                await new Promise(resolve => setTimeout(resolve, delay));
                retries++;
            } catch (error) {
                if (retries === maxRetries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, delay));
                retries++;
            }
        }

        throw new Error('Failed to fetch order details after multiple retries');
    };

    // Check payment status from URL and fetch order details
    useEffect(() => {
        setMounted(true);
        const fetchOrderDetails = async () => {
            try {
                setIsLoading(true);
                // Get the payment intent ID from the URL
                const paymentIntentId = searchParams.get('payment_intent');

                if (!paymentIntentId) {
                    setStatus('waiting');
                    return;
                }

                // Try to fetch 3 times with 2-second delays
                const data = await fetchOrderWithRetry(paymentIntentId, 3, 2000);
                setOrderDetails(data.order);
                setStatus('success');
                // Clear the cart after successful payment
                clearCart();
            } catch (error) {
                console.error('Error fetching order:', error);
                setStatus('error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrderDetails();
    }, [searchParams, clearCart]);

    if (!mounted || isLoading) {
        return (
            <div className="container mx-auto py-12 px-4 text-center">
                <div className="inline-flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
                <p className="mt-4 text-gray-600">Loading your order details...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-lg mx-auto">
                {status === 'success' && orderDetails && (
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
                                <span className="font-medium">{orderDetails.orderNumber}</span>
                            </div>
                            {orderDetails.pickupTime && (
                                <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
                                    <span className="text-gray-600">Pickup Time:</span>
                                    <span className="font-medium flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {orderDetails.pickupTime}
                                    </span>
                                </div>
                            )}
                            <div className="space-y-2">
                                <p className="text-gray-600">
                                    One of our staff members will be with you shortly to confirm.
                                </p>
                                <p className="text-gray-600">
                                    Your order will be ready for pickup at your selected time.
                                </p>
                            </div>
                        </div>
                        <Link href={`/orders/${orderDetails.id}`}>
                            <Button className="w-full mb-4">
                                View Order Details
                            </Button>
                        </Link>
                    </div>
                )}

                {status === 'waiting' && (
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-bold mb-4">Processing Payment</h1>
                        <p className="text-gray-600">
                            Your payment is being processed. Please wait a moment...
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

export default function ConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto py-12 px-4 text-center">
                <div className="inline-flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
                <p className="mt-4 text-gray-600">Loading payment information...</p>
            </div>
        }>
            <ConfirmationContent />
        </Suspense>
    );
} 