"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Loader2,
    Search,
    RefreshCw,
    Eye,
    Clock,
    CheckCircle,
    AlertCircle,
    Package,
    Truck,
    Printer,
    Receipt
} from "lucide-react";
import { OrderStatus, OrderType } from "@prisma/client";
import { getOrders, updateOrderStatus } from "@/lib/actions/order-actions";
import { generateReceiptHTML, generateKitchenTicketHTML } from "@/lib/actions/receipt-actions";

type OrderWithDetails = {
    id: string;
    orderNumber: string | null;
    total: number;
    status: OrderStatus;
    paymentStatus: string;
    orderType: OrderType;
    createdAt: Date;
    estimatedPickupTime: Date | null;
    user: {
        id: string;
        name: string | null;
        email: string;
    };
    items: Array<{
        id: string;
        quantity: number;
        price: number;
        menuItem: {
            id: string;
            name: string;
        };
    }>;
    appliedPromotion: {
        id: string;
        name: string;
        couponCode: string | null;
    } | null;
    discountAmount: number;
};

export default function OrdersManagement() {
    const [orders, setOrders] = useState<OrderWithDetails[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
    const [typeFilter, setTypeFilter] = useState<OrderType | "">("");
    const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchOrders = useCallback(async (page: number = 1) => {
        try {
            setIsRefreshing(true);
            const result = await getOrders({
                page,
                limit: 20,
                status: statusFilter || undefined,
                orderType: typeFilter || undefined,
                search: searchTerm || undefined
            });

            if (result.success && result.data) {
                setOrders(result.data.orders);
                setTotalCount(result.data.totalCount);
                setTotalPages(result.data.totalPages);
            } else {
                console.error("Failed to fetch orders:", result.error);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    }, [statusFilter, typeFilter, searchTerm]);

    useEffect(() => {
        fetchOrders(currentPage);
    }, [statusFilter, typeFilter, currentPage, fetchOrders]);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            if (searchTerm !== "") {
                setCurrentPage(1);
                fetchOrders(1);
            } else if (searchTerm === "") {
                fetchOrders(currentPage);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, currentPage, fetchOrders]);

    const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
        try {
            const result = await updateOrderStatus(orderId, newStatus);
            if (result.success) {
                // Refresh orders list
                await fetchOrders(currentPage);
                // Update selected order if it's the one being updated
                if (selectedOrder?.id === orderId) {
                    const updatedOrder = orders.find(order => order.id === orderId);
                    if (updatedOrder) {
                        setSelectedOrder({ ...updatedOrder, status: newStatus });
                    }
                }
            } else {
                console.error("Failed to update order status:", result.error);
                alert("Failed to update order status. Please try again.");
            }
        } catch (error) {
            console.error("Error updating order status:", error);
            alert("An error occurred while updating the order status.");
        }
    };

    const handlePrintReceipt = async (orderId: string) => {
        try {
            const result = await generateReceiptHTML(orderId);
            if (result.success && result.html) {
                // Open print window
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(result.html);
                    printWindow.document.close();
                    printWindow.focus();
                }
            } else {
                alert("Failed to generate receipt: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error printing receipt:", error);
            alert("An error occurred while printing the receipt.");
        }
    };

    const handlePrintKitchenTicket = async (orderId: string) => {
        try {
            const result = await generateKitchenTicketHTML(orderId);
            if (result.success && result.html) {
                // Open print window
                const printWindow = window.open('', '_blank');
                if (printWindow) {
                    printWindow.document.write(result.html);
                    printWindow.document.close();
                    printWindow.focus();
                }
            } else {
                alert("Failed to generate kitchen ticket: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error printing kitchen ticket:", error);
            alert("An error occurred while printing the kitchen ticket.");
        }
    };

    const getStatusIcon = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING:
                return <Clock className="h-4 w-4" />;
            case OrderStatus.CONFIRMED:
                return <CheckCircle className="h-4 w-4" />;
            case OrderStatus.PREPARING:
                return <Package className="h-4 w-4" />;
            case OrderStatus.READY_FOR_PICKUP:
                return <Truck className="h-4 w-4" />;
            case OrderStatus.COMPLETED:
                return <CheckCircle className="h-4 w-4" />;
            case OrderStatus.CANCELED:
                return <AlertCircle className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        switch (status) {
            case OrderStatus.PENDING:
                return "bg-orange-100 text-orange-800";
            case OrderStatus.CONFIRMED:
                return "bg-blue-100 text-blue-800";
            case OrderStatus.PREPARING:
                return "bg-yellow-100 text-yellow-800";
            case OrderStatus.READY_FOR_PICKUP:
                return "bg-green-100 text-green-800";
            case OrderStatus.COMPLETED:
                return "bg-green-100 text-green-800";
            case OrderStatus.CANCELED:
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
        switch (currentStatus) {
            case OrderStatus.PENDING:
                return OrderStatus.CONFIRMED;
            case OrderStatus.CONFIRMED:
                return OrderStatus.PREPARING;
            case OrderStatus.PREPARING:
                return OrderStatus.READY_FOR_PICKUP;
            case OrderStatus.READY_FOR_PICKUP:
                return OrderStatus.COMPLETED;
            default:
                return null;
        }
    };

    const formatTimeAgo = (date: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-2 text-gray-600">Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Orders Management</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search orders, customers..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as OrderStatus | "")}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">All Statuses</option>
                                <option value={OrderStatus.PENDING}>Pending</option>
                                <option value={OrderStatus.CONFIRMED}>Confirmed</option>
                                <option value={OrderStatus.PREPARING}>Preparing</option>
                                <option value={OrderStatus.READY_FOR_PICKUP}>Ready</option>
                                <option value={OrderStatus.COMPLETED}>Completed</option>
                                <option value={OrderStatus.CANCELED}>Canceled</option>
                            </select>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value as OrderType | "")}
                                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="">All Types</option>
                                <option value={OrderType.DINE_IN}>Dine In</option>
                                <option value={OrderType.PICKUP}>Pickup</option>
                            </select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fetchOrders(currentPage)}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Order
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Items
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Total
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {order.orderNumber || `#${order.id.slice(-6)}`}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {order.orderType === OrderType.PICKUP ? "Pickup" : "Dine In"}
                                                        {order.appliedPromotion && (
                                                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                                {order.appliedPromotion.couponCode || "Promo"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {order.user.name || order.user.email}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {order.items.reduce((total, item) => total + item.quantity, 0)} items
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {order.items.slice(0, 2).map((item, index) => (
                                                        <span key={item.id}>
                                                            {item.quantity}x {item.menuItem.name}
                                                            {index < Math.min(order.items.length, 2) - 1 && ', '}
                                                        </span>
                                                    ))}
                                                    {order.items.length > 2 && ` +${order.items.length - 2} more`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(order.total)}
                                                </div>
                                                {order.discountAmount > 0 && (
                                                    <div className="text-sm text-green-600">
                                                        -{formatCurrency(order.discountAmount)} discount
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                                    {getStatusIcon(order.status)}
                                                    <span className="ml-1">{order.status.replace('_', ' ')}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatTimeAgo(order.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedOrder(order)}
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handlePrintReceipt(order.id)}
                                                        title="Print Receipt"
                                                    >
                                                        <Receipt className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handlePrintKitchenTicket(order.id)}
                                                        title="Print Kitchen Ticket"
                                                    >
                                                        <Printer className="h-4 w-4" />
                                                    </Button>
                                                    {getNextStatus(order.status) && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status)!)}
                                                        >
                                                            {getNextStatus(order.status)?.replace('_', ' ')}
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                            {searchTerm || statusFilter || typeFilter ? "No orders match your filters" : "No orders found"}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200">
                            <div className="text-sm text-gray-700">
                                Showing {Math.min((currentPage - 1) * 20 + 1, totalCount)} to {Math.min(currentPage * 20, totalCount)} of {totalCount} orders
                            </div>
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="text-sm text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold">
                                Order {selectedOrder.orderNumber || `#${selectedOrder.id.slice(-6)}`}
                            </h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedOrder(null)}
                            >
                                ×
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-500">Customer</p>
                                <p className="font-medium">{selectedOrder.user.name || selectedOrder.user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Order Type</p>
                                <p className="font-medium">{selectedOrder.orderType === OrderType.PICKUP ? "Pickup" : "Dine In"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                                    {getStatusIcon(selectedOrder.status)}
                                    <span className="ml-1">{selectedOrder.status.replace('_', ' ')}</span>
                                </span>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Order Time</p>
                                <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h4 className="font-medium mb-3">Order Items</h4>
                            <div className="space-y-2">
                                {selectedOrder.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center py-2 border-b">
                                        <div>
                                            <span className="font-medium">{item.quantity}x {item.menuItem.name}</span>
                                        </div>
                                        <span>{formatCurrency(item.price * item.quantity)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between mb-2">
                                <span>Subtotal:</span>
                                <span>{formatCurrency(selectedOrder.total + selectedOrder.discountAmount)}</span>
                            </div>
                            {selectedOrder.discountAmount > 0 && (
                                <div className="flex justify-between mb-2 text-green-600">
                                    <span>Discount ({selectedOrder.appliedPromotion?.name}):</span>
                                    <span>-{formatCurrency(selectedOrder.discountAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg">
                                <span>Total:</span>
                                <span>{formatCurrency(selectedOrder.total)}</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => handlePrintReceipt(selectedOrder.id)}
                            >
                                <Receipt className="h-4 w-4 mr-2" />
                                Print Receipt
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handlePrintKitchenTicket(selectedOrder.id)}
                            >
                                <Printer className="h-4 w-4 mr-2" />
                                Kitchen Ticket
                            </Button>
                            {getNextStatus(selectedOrder.status) && (
                                <Button
                                    onClick={() => {
                                        handleStatusUpdate(selectedOrder.id, getNextStatus(selectedOrder.status)!);
                                        setSelectedOrder(null);
                                    }}
                                >
                                    Mark as {getNextStatus(selectedOrder.status)?.replace('_', ' ')}
                                </Button>
                            )}
                            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 