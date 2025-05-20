"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CookingPot, DollarSign, Package, ShoppingBag, Users, Utensils } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";


export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        totalBookings: 0,
        todayBookings: 0,
        revenue: 0,
    });

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

            // Simulate fetching dashboard stats
            // In a real app, this would call your API
            setTimeout(() => {
                setStats({
                    totalOrders: 124,
                    pendingOrders: 8,
                    totalBookings: 37,
                    todayBookings: 5,
                    revenue: 4825.5,
                });
                setIsLoading(false);
            }, 800);
        }
    }, [status, session, router]);

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

    return (
        <div className="container py-8 px-4 mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Staff Dashboard</h1>
                <p className="text-gray-600 mt-1">
                    Welcome back, {session?.user.name || session?.user.email}
                </p>
            </div>

            <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-8">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="menu">Menu</TabsTrigger>
                    {session?.user.role === "ADMIN" && (
                        <TabsTrigger value="users">Users</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
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
                                    Revenue
                                </CardTitle>
                                <DollarSign className="h-5 w-5 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${stats.revenue.toFixed(2)}</div>
                                <p className="text-xs text-gray-500">This month</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>
                                See the latest orders and bookings requiring attention
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="border-l-4 border-orange-500 pl-4 py-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">New order #ORD-82344</p>
                                            <p className="text-sm text-gray-500">Just now</p>
                                        </div>
                                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">
                                            Pending
                                        </span>
                                    </div>
                                </div>

                                <div className="border-l-4 border-green-500 pl-4 py-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Table for 4 confirmed</p>
                                            <p className="text-sm text-gray-500">10 minutes ago</p>
                                        </div>
                                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                            Confirmed
                                        </span>
                                    </div>
                                </div>

                                <div className="border-l-4 border-blue-500 pl-4 py-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Order #ORD-82341 ready for pickup</p>
                                            <p className="text-sm text-gray-500">25 minutes ago</p>
                                        </div>
                                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                            Ready
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="orders">
                    <Card>
                        <CardHeader>
                            <CardTitle>Orders Management</CardTitle>
                            <CardDescription>
                                Manage customer orders and update their status
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="py-8 text-center">
                            <div className="mx-auto max-w-md">
                                <Utensils className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-lg font-medium">Order Management</h3>
                                <p className="mt-1 text-gray-500">
                                    This section will allow you to view and manage all customer orders.
                                </p>
                                <p className="text-sm text-gray-500 mt-4 italic">
                                    Not implemented in this demo. In a full application, you would see a list of orders that can be filtered and sorted, with options to update order status.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bookings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reservations Management</CardTitle>
                            <CardDescription>
                                View and manage table bookings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="py-8 text-center">
                            <div className="mx-auto max-w-md">
                                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-lg font-medium">Booking Calendar</h3>
                                <p className="mt-1 text-gray-500">
                                    This section will allow you to view and manage all restaurant reservations.
                                </p>
                                <p className="text-sm text-gray-500 mt-4 italic">
                                    Not implemented in this demo. In a full application, you would see a calendar view of bookings and a list that can be filtered by date.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
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