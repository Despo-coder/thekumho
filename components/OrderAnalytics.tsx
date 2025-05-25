"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2,
    TrendingUp,
    // Clock,
    Users,
    DollarSign,
    Package,
    // Calendar,
    RefreshCw,
    Download
} from "lucide-react";
import {
    getRevenueAnalytics,
    getPopularItems,
    getOrderCompletionMetrics,
    getCustomerAnalytics,
    getOrderHistory
} from "@/lib/actions/order-analytics-actions";
import { OrderType } from "@prisma/client";

// Type definitions (same as in server actions)
type DateRange = {
    from: Date;
    to: Date;
};

type RevenueAnalytics = {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueByDay: Array<{
        date: string;
        revenue: number;
        orders: number;
    }>;
    revenueByType: Array<{
        type: OrderType;
        revenue: number;
        orders: number;
        percentage: number;
    }>;
};

type PopularItem = {
    id: string;
    name: string;
    totalQuantity: number;
    totalRevenue: number;
    orderCount: number;
    category: string;
};

type OrderCompletionMetrics = {
    averageCompletionTime: number;
    completionTimeByStatus: Array<{
        status: string;
        averageTime: number;
    }>;
    peakHours: Array<{
        hour: number;
        orderCount: number;
    }>;
};

type CustomerAnalytics = {
    totalCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    topCustomers: Array<{
        id: string;
        name: string | null;
        email: string;
        totalOrders: number;
        totalSpent: number;
    }>;
};

type OrderHistoryData = {
    orders: unknown[];
    totalCount: number;
    totalPages: number;
    totalRevenue: number;
};

export default function OrderAnalytics() {
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("revenue");
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        to: new Date()
    });

    // Analytics data states
    const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
    const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
    const [completionMetrics, setCompletionMetrics] = useState<OrderCompletionMetrics | null>(null);
    const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics | null>(null);
    const [orderHistory, setOrderHistory] = useState<OrderHistoryData | null>(null);

    // Loading states
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchAnalyticsData = useCallback(async () => {
        try {
            setIsRefreshing(true);

            const [
                revenueResult,
                popularItemsResult,
                completionResult,
                customerResult
            ] = await Promise.all([
                getRevenueAnalytics(dateRange),
                getPopularItems(dateRange, 10),
                getOrderCompletionMetrics(dateRange),
                getCustomerAnalytics(dateRange)
            ]);

            if (revenueResult.success && revenueResult.data) {
                setRevenueData(revenueResult.data);
            }

            if (popularItemsResult.success && popularItemsResult.data) {
                setPopularItems(popularItemsResult.data);
            }

            if (completionResult.success && completionResult.data) {
                setCompletionMetrics(completionResult.data);
            }

            if (customerResult.success && customerResult.data) {
                setCustomerAnalytics(customerResult.data);
            }

        } catch (error) {
            console.error("Error fetching analytics data:", error);
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    }, [dateRange]);

    const fetchOrderHistory = useCallback(async () => {
        try {
            const result = await getOrderHistory({
                page: 1,
                limit: 100,
                dateRange
            });

            if (result.success && result.data) {
                setOrderHistory(result.data);
            }
        } catch (error) {
            console.error("Error fetching order history:", error);
        }
    }, [dateRange]);

    useEffect(() => {
        fetchAnalyticsData();
    }, [dateRange, fetchAnalyticsData]);

    useEffect(() => {
        if (activeTab === "history") {
            fetchOrderHistory();
        }
    }, [activeTab, dateRange, fetchOrderHistory]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    };

    const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        }
        return `${mins}m`;
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-2 text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Date Range Selector */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Order Analytics</CardTitle>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium">From:</label>
                                <Input
                                    type="date"
                                    value={formatDate(dateRange.from)}
                                    onChange={(e) => setDateRange(prev => ({
                                        ...prev,
                                        from: new Date(e.target.value)
                                    }))}
                                    className="w-auto"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <label className="text-sm font-medium">To:</label>
                                <Input
                                    type="date"
                                    value={formatDate(dateRange.to)}
                                    onChange={(e) => setDateRange(prev => ({
                                        ...prev,
                                        to: new Date(e.target.value)
                                    }))}
                                    className="w-auto"
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchAnalyticsData}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="revenue">Revenue</TabsTrigger>
                    <TabsTrigger value="popular">Popular Items</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                    <TabsTrigger value="history">Order History</TabsTrigger>
                </TabsList>

                <TabsContent value="revenue" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(revenueData?.totalRevenue || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {revenueData?.totalOrders || 0} orders
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                                <TrendingUp className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(revenueData?.averageOrderValue || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Per order average
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                                <Package className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {revenueData?.totalOrders || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Orders placed
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Revenue by Order Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Revenue by Order Type</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {revenueData?.revenueByType.map((type) => (
                                    <div key={type.type} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="font-medium">
                                                {type.type === OrderType.PICKUP ? "Pickup" : "Dine In"}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {type.orders} orders
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{formatCurrency(type.revenue)}</div>
                                            <div className="text-sm text-gray-500">{type.percentage.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Daily Revenue Chart (Simple table for now) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Revenue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                                {revenueData?.revenueByDay.map((day) => (
                                    <div key={day.date} className="flex items-center justify-between py-2 border-b">
                                        <div>{new Date(day.date).toLocaleDateString()}</div>
                                        <div className="text-right">
                                            <div className="font-medium">{formatCurrency(day.revenue)}</div>
                                            <div className="text-sm text-gray-500">{day.orders} orders</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="popular" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Most Popular Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {popularItems.map((item, index) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-600 rounded-full font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-sm text-gray-500">{item.category}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{item.totalQuantity} sold</div>
                                            <div className="text-sm text-gray-500">
                                                {formatCurrency(item.totalRevenue)} revenue
                                            </div>
                                            <div className="text-xs text-gray-400">
                                                {item.orderCount} orders
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Average Completion Time</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    {formatTime(completionMetrics?.averageCompletionTime || 0)}
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    From order to completion
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Completion Time by Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {completionMetrics?.completionTimeByStatus.map((statusTime) => (
                                        <div key={statusTime.status} className="flex justify-between">
                                            <span className="text-sm">{statusTime.status.replace('_', ' ')}</span>
                                            <span className="text-sm font-medium">
                                                {formatTime(statusTime.averageTime)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Peak Hours</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {completionMetrics?.peakHours.slice(0, 8).map((hour) => (
                                    <div key={hour.hour} className="text-center p-3 border rounded-lg">
                                        <div className="text-lg font-bold">
                                            {hour.hour}:00
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {hour.orderCount} orders
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="customers" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                                <Users className="h-4 w-4 text-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {customerAnalytics?.totalCustomers || 0}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">New Customers</CardTitle>
                                <Users className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {customerAnalytics?.newCustomers || 0}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Returning Customers</CardTitle>
                                <Users className="h-4 w-4 text-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {customerAnalytics?.returningCustomers || 0}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Top Customers</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {customerAnalytics?.topCustomers.map((customer, index) => (
                                    <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-bold">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="font-medium">
                                                    {customer.name || customer.email}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {customer.totalOrders} orders
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">
                                                {formatCurrency(customer.totalSpent)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Order History Export</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {orderHistory && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-lg font-semibold">
                                                {orderHistory.totalCount} Total Orders
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                Total Revenue: {formatCurrency(orderHistory.totalRevenue)}
                                            </div>
                                        </div>
                                        <Button>
                                            <Download className="h-4 w-4 mr-2" />
                                            Export CSV
                                        </Button>
                                    </div>

                                    <div className="text-sm text-gray-500">
                                        Order history data for the selected date range is ready for export.
                                        This includes order details, customer information, and payment data.
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 