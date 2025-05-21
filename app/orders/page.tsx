"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import { formatDistanceToNow, format } from "date-fns";
import Image from "next/image";
import {
    ShoppingBag,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    XCircle,
    ChevronRight,
    Package,
    Utensils,
    Home
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { getUserOrders, cancelOrder, OrderWithItems } from "@/lib/actions/order-actions";

export default function OrdersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

    // Load orders when session is ready
    useEffect(() => {
        async function fetchOrders() {
            if (status === "authenticated" && session?.user?.id) {
                try {
                    setLoading(true);
                    const result = await getUserOrders(session.user.id);

                    if (result.orders && result.orders) {
                        setOrders(result.orders as unknown as OrderWithItems[]);
                    } else {
                        setError(result.error || "Failed to load orders");
                    }
                } catch (err) {
                    console.error("Error loading orders:", err);
                    setError("An unexpected error occurred");
                } finally {
                    setLoading(false);
                }
            } else if (status === "unauthenticated") {
                router.push("/login?callbackUrl=/orders");
            }
        }

        fetchOrders();
    }, [status, session, router]);

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case "PENDING":
                return "bg-yellow-100 text-yellow-800";
            case "CONFIRMED":
                return "bg-blue-100 text-blue-800";
            case "PREPARING":
                return "bg-purple-100 text-purple-800";
            case "READY_FOR_PICKUP":
                return "bg-green-100 text-green-800";
            case "COMPLETED":
                return "bg-green-100 text-green-800";
            case "CANCELED":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPaymentStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case "PAID":
                return "bg-green-100 text-green-800";
            case "PENDING":
                return "bg-yellow-100 text-yellow-800";
            case "FAILED":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getOrderTypeIcon = (orderType: string) => {
        if (orderType === "PICKUP") {
            return <Package className="w-4 h-4" />;
        } else {
            return <Utensils className="w-4 h-4" />;
        }
    };

    const handleCancelOrder = async (orderId: string) => {
        if (!session?.user?.id) return;

        try {
            setCancellingOrder(orderId);
            const result = await cancelOrder(orderId, session.user.id);

            if (result.success) {
                // Update the order in the UI
                setOrders(prevOrders =>
                    prevOrders.map(order =>
                        order.id === orderId && result.orders?.[0]
                            ? result.orders[0]
                            : order
                    )
                );
            } else {
                alert(result.error || "Failed to cancel order");
            }
        } catch (err) {
            console.error("Error cancelling order:", err);
            alert("An error occurred while cancelling your order");
        } finally {
            setCancellingOrder(null);
        }
    };

    const refreshOrders = async () => {
        if (!session?.user?.id) return;

        try {
            setLoading(true);
            setError("");
            const result = await getUserOrders(session.user.id);

            if (result.orders && result.orders) {
                setOrders(result.orders as unknown as OrderWithItems[]);
            } else {
                setError(result.error || "Failed to refresh orders");
            }
        } catch (err) {
            console.error("Error refreshing orders:", err);
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="container mx-auto py-12 px-4">
                <div className="flex flex-col items-center justify-center min-h-[50vh]">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-4" />
                    <p className="text-gray-600">Loading your orders...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto py-12 px-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center max-w-md mx-auto">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                    <h2 className="text-lg font-medium text-red-800 mb-2">Error</h2>
                    <p className="text-red-700">{error}</p>
                    <button
                        onClick={refreshOrders}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">My Orders</h1>
                    <p className="text-gray-600">View and track your orders</p>
                </div>
                <Button
                    variant="outline"
                    onClick={refreshOrders}
                    className="self-start flex items-center gap-2"
                >
                    <Clock className="w-4 h-4" />
                    Refresh
                </Button>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h2>
                    <p className="text-gray-600 mb-6">You haven&apos;t placed any orders with us yet.</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button
                            onClick={() => router.push("/menu")}
                            className="bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-2"
                        >
                            <Utensils className="w-4 h-4" />
                            Explore Our Menu
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push("/")}
                            className="flex items-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Return to Home
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
                            <div className="bg-gray-50 px-6 py-4">
                                <div className="flex flex-wrap items-center justify-between gap-y-2">
                                    <div>
                                        <div className="text-base font-medium">Order #{order.orderNumber || order.id.slice(-6)}</div>
                                        <div className="text-sm text-gray-500 flex items-center gap-2">
                                            <Clock className="w-3 h-3" />
                                            <span>
                                                {order.createdAt && formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                            </span>
                                            <span className="text-gray-400">•</span>
                                            <span className="flex items-center gap-1">
                                                {getOrderTypeIcon(order.orderType)}
                                                {order.orderType}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                                            {order.status.replace(/_/g, " ")}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(order.paymentStatus)}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4">
                                <div className="space-y-3">
                                    {order.items?.map((item) => (
                                        <div key={item.id} className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                                {item.menuItem.image ? (
                                                    <Image
                                                        src={item.menuItem.image}
                                                        alt={item.menuItem.name}
                                                        width={48}
                                                        height={48}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                                        <Utensils className="w-6 h-6 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-800 font-medium truncate">
                                                        {item.quantity}x {item.menuItem.name}
                                                    </span>
                                                    <span className="text-gray-700 ml-2 flex-shrink-0">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </span>
                                                </div>
                                                {item.specialInstructions && (
                                                    <p className="text-sm text-gray-500 italic truncate">
                                                        &quot;{item.specialInstructions}&quot;
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                                    <span className="font-medium">Total</span>
                                    <span className="font-medium">${Number(order.total).toFixed(2)}</span>
                                </div>
                            </div>

                            {order.status === "READY_FOR_PICKUP" && (
                                <div className="px-6 py-3 bg-green-50 border-t border-green-100">
                                    <div className="flex items-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                                        <span className="text-green-800 text-sm">
                                            Your order is ready for pickup!
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Order Actions */}
                            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-3 justify-between items-center">
                                <div className="text-sm text-gray-500">
                                    {order.estimatedPickupTime ? (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            Pickup time: {format(new Date(order.estimatedPickupTime), 'h:mm a, MMM d')}
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" />
                                            Placed: {format(new Date(order.createdAt), 'h:mm a, MMM d')}
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            disabled={cancellingOrder === order.id}
                                            onClick={() => handleCancelOrder(order.id)}
                                            className="flex items-center gap-1"
                                        >
                                            {cancellingOrder === order.id ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <XCircle className="w-4 h-4" />
                                            )}
                                            Cancel Order
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex items-center gap-1"
                                        onClick={() => router.push(`/orders/${order.id}`)}
                                    >
                                        Details
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 