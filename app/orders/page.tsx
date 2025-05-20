"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Order, OrderStatus, PaymentStatus } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";
import {
    ShoppingBag,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2
} from "lucide-react";

type OrderWithItems = Order & {
    items: {
        id: string;
        quantity: number;
        price: number;
        menuItem: {
            name: string;
        };
    }[];
};

export default function OrdersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/orders?userId=${session?.user.id}`);

            if (!response.ok) {
                throw new Error("Failed to fetch orders");
            }

            const data = await response.json();
            setOrders(data.orders);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setError("Failed to load your orders. Please try again later.");
        } finally {
            setLoading(false);
        }
    }, [session?.user.id]);

    useEffect(() => {
        // Redirect if not authenticated
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/orders");
            return;
        }

        // Fetch orders if authenticated
        if (status === "authenticated") {
            fetchOrders();
        }
    }, [status, router, fetchOrders]);

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
                        onClick={fetchOrders}
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
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">My Orders</h1>
                <p className="text-gray-600">View and track your orders</p>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-xl font-medium text-gray-900 mb-2">No orders yet</h2>
                    <p className="text-gray-600 mb-6">You haven&apos;t placed any orders with us yet.</p>
                    <button
                        onClick={() => router.push("/menu")}
                        className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600"
                    >
                        Explore Our Menu
                    </button>
                </div>
            ) : (
                <div className="grid gap-6">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4">
                                <div className="flex flex-wrap items-center justify-between gap-y-2">
                                    <div>
                                        <div className="text-sm text-gray-500">Order #{order.orderNumber || order.id.slice(-6)}</div>
                                        <div className="text-sm text-gray-500">
                                            {order.createdAt && (
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDistanceToNow(new Date(order.createdAt), { addSuffix: true })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                                            {order.status.replace("_", " ")}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(order.paymentStatus)}`}>
                                            {order.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4">
                                <div className="space-y-2">
                                    {order.items?.map((item) => (
                                        <div key={item.id} className="flex justify-between items-center">
                                            <div className="flex items-center">
                                                <span className="text-gray-800 font-medium">
                                                    {item.quantity}x
                                                </span>
                                                <span className="ml-2">{item.menuItem.name}</span>
                                            </div>
                                            <span className="text-gray-700">${(item.price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between">
                                    <span className="font-medium">Total</span>
                                    <span className="font-medium">${Number(order.total).toFixed(2)}</span>
                                </div>
                            </div>

                            {(order.status === "READY_FOR_PICKUP") && (
                                <div className="px-6 py-3 bg-green-50 border-t border-green-100">
                                    <div className="flex items-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mr-2" />
                                        <span className="text-green-800 text-sm">
                                            Your order is ready for pickup!
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
} 