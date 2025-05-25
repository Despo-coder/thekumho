"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CookingPot, DollarSign, Package, ShoppingBag, Users, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getDashboardStats, getRecentActivity } from "@/lib/actions/order-actions";
import OrdersManagement from "@/components/OrdersManagement";
import OrderAnalytics from "@/components/OrderAnalytics";
import BookingsManagement from "@/components/BookingsManagement";

type DashboardStats = {
    totalOrders: number;
    pendingOrders: number;
    todayOrders: number;
    totalBookings: number;
    todayBookings: number;
    todayRevenue: number;
    lastUpdated: string;
};

type RecentActivity = {
    id: string;
    type: 'order' | 'booking';
    title: string;
    subtitle: string;
    status: string;
    statusColor: string;
    timestamp: Date;
};

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalOrders: 0,
        pendingOrders: 0,
        todayOrders: 0,
        totalBookings: 0,
        todayBookings: 0,
        todayRevenue: 0,
        lastUpdated: new Date().toISOString()
    });
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchDashboardData = async () => {
        try {
            setIsRefreshing(true);
            const [statsResult, activityResult] = await Promise.all([
                getDashboardStats(),
                getRecentActivity(6)
            ]);

            if (statsResult.success && statsResult.data) {
                setStats(statsResult.data);
            } else {
                console.error("Failed to fetch stats:", statsResult.error);
            }

            if (activityResult.success && activityResult.data) {
                setRecentActivity(activityResult.data);
            } else {
                console.error("Failed to fetch recent activity:", activityResult.error);
            }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Check if user is authenticated and has appropriate role
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/admin");
            return;
        }

        if (status === "authenticated") {
            if (
                session.user.role !== "ADMIN" &&
                session.user.role !== "MANAGER" &&
                session.user.role !== "CHEF" &&
                session.user.role !== "WAITER"
            ) {
                router.push("/");
                return;
            }

            // Fetch real dashboard data
            fetchDashboardData();
        }
    }, [status, session, router]);

    // Auto-refresh data every 30 seconds when on overview tab
    useEffect(() => {
        if (activeTab === "overview" && !isLoading) {
            const interval = setInterval(() => {
                fetchDashboardData();
            }, 30000); // 30 seconds

            return () => clearInterval(interval);
        }
    }, [activeTab, isLoading]);

    if (status === "loading" || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    const getStatusBadgeClasses = (color: string) => {
        const baseClasses = "px-2 py-1 text-xs rounded-full font-medium";
        switch (color) {
            case 'orange':
                return `${baseClasses} bg-orange-100 text-orange-800`;
            case 'green':
                return `${baseClasses} bg-green-100 text-green-800`;
            case 'blue':
                return `${baseClasses} bg-blue-100 text-blue-800`;
            case 'red':
                return `${baseClasses} bg-red-100 text-red-800`;
            case 'yellow':
                return `${baseClasses} bg-yellow-100 text-yellow-800`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800`;
        }
    };

    const getBorderColor = (color: string) => {
        switch (color) {
            case 'orange': return 'border-orange-500';
            case 'green': return 'border-green-500';
            case 'blue': return 'border-blue-500';
            case 'red': return 'border-red-500';
            case 'yellow': return 'border-yellow-500';
            default: return 'border-gray-500';
        }
    };

    const formatTimeAgo = (timestamp: Date) => {
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - new Date(timestamp).getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    return (
        <div className="container py-8 px-4 mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Kumho Dashboard</h1>
                <p className="text-gray-600 mt-1">
                    Welcome back, {session?.user.name || session?.user.email}
                </p>
            </div>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-8">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="menu">Menu</TabsTrigger>
                    {session?.user.role === "ADMIN" && (
                        <TabsTrigger value="users">Users</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Overview</h2>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchDashboardData}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                            {isRefreshing ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">
                                    Total Orders
                                </CardTitle>
                                <ShoppingBag className="h-5 w-5 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.totalOrders}</div>
                                <p className="text-xs text-gray-500">All time orders placed</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">
                                    Pending Orders
                                </CardTitle>
                                <Package className="h-5 w-5 text-orange-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                                <p className="text-xs text-gray-500">Requiring attention</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">
                                    Today&apos;s Reservations
                                </CardTitle>
                                <Calendar className="h-5 w-5 text-gray-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.todayBookings}</div>
                                <p className="text-xs text-gray-500">Bookings for today</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">
                                    Today&apos;s Revenue
                                </CardTitle>
                                <DollarSign className="h-5 w-5 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${stats.todayRevenue.toFixed(2)}</div>
                                <p className="text-xs text-gray-500">
                                    {stats.todayOrders} orders today
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>
                                Latest orders and bookings requiring attention
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentActivity.length > 0 ? (
                                <div className="space-y-4">
                                    {recentActivity.map((activity) => (
                                        <div key={activity.id} className={`border-l-4 ${getBorderColor(activity.statusColor)} pl-4 py-2`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-medium">{activity.title}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {activity.subtitle} • {formatTimeAgo(activity.timestamp)}
                                                    </p>
                                                </div>
                                                <span className={getStatusBadgeClasses(activity.statusColor)}>
                                                    {activity.status}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-center py-4">No recent activity</p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orders">
                    <OrdersManagement />
                </TabsContent>

                <TabsContent value="analytics">
                    <OrderAnalytics />
                </TabsContent>

                <TabsContent value="bookings">
                    <BookingsManagement />
                </TabsContent>

                <TabsContent value="menu">
                    <Card>
                        <CardHeader>
                            <CardTitle>Menu Management</CardTitle>
                            <CardDescription>
                                Add, edit, or remove menu items
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="py-8">
                            <div className="mx-auto max-w-md">
                                <CookingPot className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-lg font-medium text-center">Menu Items</h3>
                                <p className="mt-1 text-center text-gray-500">
                                    Manage your restaurant&apos;s menu with our comprehensive menu management system.
                                </p>
                                <div className="mt-6 flex justify-center">
                                    <Link href="/admin/menu">
                                        <Button>
                                            Go to Menu Management
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Management</CardTitle>
                            <CardDescription>
                                Manage staff and customer accounts
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="py-8 text-center">
                            <div className="mx-auto max-w-md">
                                <Users className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-lg font-medium">User Accounts</h3>
                                <p className="mt-1 text-gray-500">
                                    This section will allow you to manage user accounts and permissions.
                                </p>
                                <p className="text-sm text-gray-500 mt-4 italic">
                                    Not implemented in this demo. In a full application, this would include a list of users with options to edit roles and permissions.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
} 