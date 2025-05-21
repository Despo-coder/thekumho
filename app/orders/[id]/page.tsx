'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { getOrderById, cancelOrder, OrderWithItems } from '@/lib/actions/order-actions';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Loader2,
    Package,
    ShoppingBag,
    Utensils,
    XCircle,
    AlertCircle,
    Receipt,
    CreditCard,
    Calendar
} from 'lucide-react';

interface OrderDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
    const resolvedParams = React.use(params);
    const orderId = resolvedParams.id;

    const router = useRouter();
    const { data: session, status } = useSession();
    const [order, setOrder] = useState<OrderWithItems | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancellingOrder, setCancellingOrder] = useState(false);

    useEffect(() => {
        const loadOrder = async () => {
            if (status === 'authenticated' && session?.user?.id && orderId) {
                try {
                    setLoading(true);
                    const result = await getOrderById(orderId);

                    if (result.order) {
                        setOrder(result.order as unknown as OrderWithItems);
                    } else {
                        setError(result.error || 'Order not found');
                    }
                } catch (err) {
                    console.error('Error loading order:', err);
                    setError('Failed to load order details');
                } finally {
                    setLoading(false);
                }
            } else if (status === 'unauthenticated') {
                router.push('/login?callbackUrl=/orders/' + orderId);
            }
        };

        loadOrder();
    }, [orderId, status, session, router]);

    const handleCancelOrder = async () => {
        if (!session?.user?.id || !order) return;

        try {
            setCancellingOrder(true);
            const result = await cancelOrder(order.id, session.user.id);

            if (result.success && result.orders && result.orders.length > 0) {
                setOrder(result.orders[0]);
            } else {
                alert(result.error || 'Failed to cancel order');
            }
        } catch (err) {
            console.error('Error cancelling order:', err);
            alert('An error occurred while cancelling your order');
        } finally {
            setCancellingOrder(false);
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'CONFIRMED':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'PREPARING':
                return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'READY_FOR_PICKUP':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'CANCELED':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getPaymentStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case 'PAID':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'FAILED':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getOrderTypeIcon = (orderType: string) => {
        if (orderType === 'PICKUP') {
            return <Package className="w-5 h-5" />;
        }
        return <Utensils className="w-5 h-5" />;
    };

    const getStatusStep = (currentStatus: OrderStatus) => {
        const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'];

        if (currentStatus === 'CANCELED') {
            return -1; // Special case for cancelled orders
        }

        return statuses.findIndex(status => status === currentStatus);
    };

    if (loading) {
        return (
            <div className="container mx-auto py-12 px-4">
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                    <p className="text-gray-600">Loading order details...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="container mx-auto py-12 px-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md mx-auto">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-medium text-red-800 mb-2">Error</h2>
                    <p className="text-red-700">{error || 'Order not found'}</p>
                    <Button
                        onClick={() => router.push('/orders')}
                        className="mt-4 bg-red-600 hover:bg-red-700 text-white"
                    >
                        Back to My Orders
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {/* Header with back button */}
            <div className="mb-6 flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/orders')}
                    className="flex items-center gap-1"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to My Orders
                </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Order summary */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                            <h1 className="text-xl font-semibold flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-orange-500" />
                                Order #{order.orderNumber || order.id.slice(-6)}
                            </h1>
                            <div className="text-sm text-gray-500 mt-1">
                                Placed on {format(new Date(order.createdAt), 'MMMM d, yyyy')} at {format(new Date(order.createdAt), 'h:mm a')}
                            </div>
                        </div>

                        {/* Order Status Tracker */}
                        {order.status !== 'CANCELED' && (
                            <div className="px-6 py-4 border-b border-gray-100">
                                <div className="relative">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-xs font-medium">Pending</span>
                                        <span className="text-xs font-medium">Confirmed</span>
                                        <span className="text-xs font-medium">Preparing</span>
                                        <span className="text-xs font-medium">Ready</span>
                                        <span className="text-xs font-medium">Completed</span>
                                    </div>
                                    <div className="overflow-hidden h-2 text-xs flex bg-gray-200 rounded">
                                        <div
                                            className="bg-orange-500 rounded transition-all duration-500"
                                            style={{
                                                width: `${Math.max(0, Math.min(100, (getStatusStep(order.status) / 4) * 100))}%`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Order Details */}
                        <div className="px-6 py-4">
                            <div className="flex flex-wrap gap-3 mb-6">
                                <div className={`px-3 py-1 rounded-full text-sm border ${getStatusColor(order.status)}`}>
                                    {order.status.replace(/_/g, " ")}
                                </div>
                                <div className={`px-3 py-1 rounded-full text-sm border ${getPaymentStatusColor(order.paymentStatus)}`}>
                                    {order.paymentStatus}
                                </div>
                                <div className="px-3 py-1 rounded-full text-sm border border-gray-200 bg-gray-100 text-gray-800 flex items-center gap-1">
                                    {getOrderTypeIcon(order.orderType)}
                                    <span>{order.orderType}</span>
                                </div>
                            </div>

                            <h2 className="font-medium text-gray-900 mb-4">Items</h2>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100">
                                        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                            {item.menuItem.image ? (
                                                <Image
                                                    src={item.menuItem.image}
                                                    alt={item.menuItem.name}
                                                    width={64}
                                                    height={64}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                    <Utensils className="w-6 h-6 text-gray-400" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <h3 className="font-medium">{item.menuItem.name}</h3>
                                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {item.quantity} × ${Number(item.price).toFixed(2)}
                                            </div>
                                            {item.specialInstructions && (
                                                <div className="text-sm text-gray-500 italic mt-1">
                                                    &quot;{item.specialInstructions}&quot;
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span>${(Number(order.total) * 0.93).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">Tax (7%)</span>
                                    <span>${(Number(order.total) * 0.07).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between py-2 text-lg font-medium">
                                    <span>Total</span>
                                    <span>${Number(order.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {order.status === 'READY_FOR_PICKUP' && (
                            <div className="px-6 py-4 bg-green-50 border-t border-green-100">
                                <div className="flex items-center">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                                    <span className="text-green-800">
                                        Your order is ready for pickup!
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Order Actions */}
                        {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                                <Button
                                    variant="destructive"
                                    disabled={cancellingOrder}
                                    onClick={handleCancelOrder}
                                    className="flex items-center gap-2"
                                >
                                    {cancellingOrder ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <XCircle className="w-4 h-4" />
                                    )}
                                    Cancel This Order
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Order sidebar */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden sticky top-24">
                        {/* Order Info */}
                        <div className="px-6 py-4 border-b border-gray-100">
                            <h2 className="font-medium text-gray-900 mb-3">Order Information</h2>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3">
                                    <Receipt className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Order ID</p>
                                        <p className="text-sm text-gray-500">{order.id}</p>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Date Placed</p>
                                        <p className="text-sm text-gray-500">{format(new Date(order.createdAt), 'MMMM d, yyyy')}</p>
                                    </div>
                                </li>
                                {order.orderType === 'PICKUP' && order.estimatedPickupTime && (
                                    <li className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Pickup Time</p>
                                            <p className="text-sm text-gray-500">
                                                {format(new Date(order.estimatedPickupTime), 'MMMM d, yyyy')} at {format(new Date(order.estimatedPickupTime), 'h:mm a')}
                                            </p>
                                        </div>
                                    </li>
                                )}
                                <li className="flex items-start gap-3">
                                    <CreditCard className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium">Payment Method</p>
                                        <p className="text-sm text-gray-500">{order.paymentMethod || 'Unknown'}</p>
                                    </div>
                                </li>
                            </ul>
                        </div>

                        {/* Notes */}
                        {order.orderNotes && (
                            <div className="px-6 py-4">
                                <h2 className="font-medium text-gray-900 mb-2">Order Notes</h2>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-100">
                                    {order.orderNotes}
                                </p>
                            </div>
                        )}

                        {/* Help */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                            <h2 className="font-medium text-gray-900 mb-2">Need Help?</h2>
                            <p className="text-sm text-gray-600 mb-3">
                                Contact us if you have any questions about your order.
                            </p>
                            <Button variant="outline" className="w-full" onClick={() => router.push('/contact')}>
                                Contact Support
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 