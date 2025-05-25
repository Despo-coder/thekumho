"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Loader2,
    Search,
    RefreshCw,
    Eye,
    Clock,
    CheckCircle,
    Calendar,
    PlusCircle,
    Users,
    Phone,
    Mail,
    MapPin,
    X
} from "lucide-react";
import {
    getBookings,
    updateBookingStatus,
    createBooking,
    deleteBooking,
    getBookingStats,
    getTodayBookings
} from "@/lib/actions/booking-actions";

// Type definitions
type BookingWithCustomer = {
    id: number;
    customerName: string;
    email: string | null;
    phone: string | null;
    partySize: number;
    bookingTime: Date;
    status: string;
    specialRequest: string | null;
    tableId: number | null;
    createdAt: Date;
};

type BookingStats = {
    totalBookings: number;
    todayBookings: number;
    upcomingBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    completedBookings: number;
};

export default function BookingsManagement() {
    const [bookings, setBookings] = useState<BookingWithCustomer[]>([]);
    const [todayBookings, setTodayBookings] = useState<BookingWithCustomer[]>([]);
    const [stats, setStats] = useState<BookingStats>({
        totalBookings: 0,
        todayBookings: 0,
        upcomingBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        completedBookings: 0
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [dateFilter, setDateFilter] = useState<string>("");
    const [selectedBooking, setSelectedBooking] = useState<BookingWithCustomer | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab, setActiveTab] = useState("all");

    // New booking form state
    const [newBooking, setNewBooking] = useState({
        customerName: "",
        email: "",
        phone: "",
        partySize: 2,
        bookingTime: "",
        specialRequest: ""
    });

    const fetchBookings = useCallback(async (page: number = 1) => {
        try {
            setIsRefreshing(true);
            const result = await getBookings({
                page,
                limit: 20,
                status: statusFilter || undefined,
                date: dateFilter ? new Date(dateFilter) : undefined,
                search: searchTerm || undefined
            });

            if (result.success && result.data) {
                setBookings(result.data.bookings);
                setTotalCount(result.data.totalCount);
                setTotalPages(result.data.totalPages);
            } else {
                console.error("Failed to fetch bookings:", result.error);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    }, [statusFilter, dateFilter, searchTerm]);

    const fetchStats = useCallback(async () => {
        try {
            const result = await getBookingStats();
            if (result.success && result.data) {
                setStats(result.data);
            }
        } catch (error) {
            console.error("Error fetching booking stats:", error);
        }
    }, []);

    const fetchTodayBookings = useCallback(async () => {
        try {
            const result = await getTodayBookings();
            if (result.success && result.data) {
                setTodayBookings(result.data);
            }
        } catch (error) {
            console.error("Error fetching today's bookings:", error);
        }
    }, []);

    useEffect(() => {
        fetchBookings(currentPage);
        fetchStats();
        fetchTodayBookings();
    }, [fetchBookings, fetchStats, fetchTodayBookings, currentPage]);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            if (searchTerm !== "") {
                setCurrentPage(1);
                fetchBookings(1);
            } else if (searchTerm === "") {
                fetchBookings(currentPage);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, currentPage, fetchBookings]);

    const handleStatusUpdate = async (bookingId: number, newStatus: string, tableId?: number) => {
        try {
            const result = await updateBookingStatus(bookingId, newStatus, tableId);
            if (result.success) {
                await Promise.all([
                    fetchBookings(currentPage),
                    fetchStats(),
                    fetchTodayBookings()
                ]);
                if (selectedBooking?.id === bookingId) {
                    setSelectedBooking(prev => prev ? { ...prev, status: newStatus, tableId: tableId || prev.tableId } : null);
                }
            } else {
                console.error("Failed to update booking status:", result.error);
                alert("Failed to update booking status. Please try again.");
            }
        } catch (error) {
            console.error("Error updating booking status:", error);
            alert("An error occurred while updating the booking status.");
        }
    };

    const handleCreateBooking = async () => {
        try {
            if (!newBooking.customerName || !newBooking.bookingTime) {
                alert("Please fill in required fields (name and booking time)");
                return;
            }

            const result = await createBooking({
                customerName: newBooking.customerName,
                email: newBooking.email || undefined,
                phone: newBooking.phone || undefined,
                partySize: newBooking.partySize,
                bookingTime: new Date(newBooking.bookingTime),
                specialRequest: newBooking.specialRequest || undefined
            });

            if (result.success) {
                setShowCreateModal(false);
                setNewBooking({
                    customerName: "",
                    email: "",
                    phone: "",
                    partySize: 2,
                    bookingTime: "",
                    specialRequest: ""
                });
                await Promise.all([
                    fetchBookings(currentPage),
                    fetchStats(),
                    fetchTodayBookings()
                ]);
                alert("Booking created successfully!");
            } else {
                alert("Failed to create booking: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error creating booking:", error);
            alert("An error occurred while creating the booking.");
        }
    };

    const handleDeleteBooking = async (bookingId: number) => {
        if (!confirm("Are you sure you want to delete this booking?")) {
            return;
        }

        try {
            const result = await deleteBooking(bookingId);
            if (result.success) {
                await Promise.all([
                    fetchBookings(currentPage),
                    fetchStats(),
                    fetchTodayBookings()
                ]);
                setSelectedBooking(null);
            } else {
                alert("Failed to delete booking: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error deleting booking:", error);
            alert("An error occurred while deleting the booking.");
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return "bg-orange-100 text-orange-800";
            case 'confirmed':
                return "bg-blue-100 text-blue-800";
            case 'completed':
                return "bg-green-100 text-green-800";
            case 'cancelled':
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <Clock className="h-4 w-4" />;
            case 'confirmed':
                return <CheckCircle className="h-4 w-4" />;
            case 'completed':
                return <CheckCircle className="h-4 w-4" />;
            case 'cancelled':
                return <X className="h-4 w-4" />;
            default:
                return <Clock className="h-4 w-4" />;
        }
    };

    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleString();
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-2 text-gray-600">Loading bookings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalBookings}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Bookings(Today)</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.todayBookings}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Users className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingBookings}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.confirmedBookings}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All Bookings</TabsTrigger>
                    <TabsTrigger value="today">Today</TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Reservations Management</CardTitle>
                                <Button onClick={() => setShowCreateModal(true)}>
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    New Booking
                                </Button>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search bookings..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="confirmed">Confirmed</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                    <Input
                                        type="date"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                        className="w-auto"
                                    />
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchBookings(currentPage)}
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
                                                Customer
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Party Size
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date & Time
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Table
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {bookings.length > 0 ? (
                                            bookings.map((booking) => (
                                                <tr key={booking.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {booking.customerName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {booking.email && (
                                                                    <div className="flex items-center">
                                                                        <Mail className="h-3 w-3 mr-1" />
                                                                        {booking.email}
                                                                    </div>
                                                                )}
                                                                {booking.phone && (
                                                                    <div className="flex items-center">
                                                                        <Phone className="h-3 w-3 mr-1" />
                                                                        {booking.phone}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        <div className="flex items-center">
                                                            <Users className="h-4 w-4 mr-1" />
                                                            {booking.partySize}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {formatDateTime(booking.bookingTime)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                            {getStatusIcon(booking.status)}
                                                            <span className="ml-1 capitalize">{booking.status}</span>
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {booking.tableId ? (
                                                            <div className="flex items-center">
                                                                <MapPin className="h-4 w-4 mr-1" />
                                                                Table {booking.tableId}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">Not assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setSelectedBooking(booking)}
                                                                title="View Details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            {booking.status === 'pending' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                                >
                                                                    Confirm
                                                                </Button>
                                                            )}
                                                            {booking.status === 'confirmed' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                                                >
                                                                    Complete
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                    {searchTerm || statusFilter || dateFilter ? "No bookings match your filters" : "No bookings found"}
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
                                        Showing {Math.min((currentPage - 1) * 20 + 1, totalCount)} to {Math.min(currentPage * 20, totalCount)} of {totalCount} bookings
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
                </TabsContent>

                <TabsContent value="today">
                    <Card>
                        <CardHeader>
                            <CardTitle>Reservations(Today)</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {todayBookings.length > 0 ? (
                                    todayBookings.map((booking) => (
                                        <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-4">
                                                    <div>
                                                        <div className="font-medium">{booking.customerName}</div>
                                                        <div className="text-sm text-gray-500">
                                                            {formatTime(booking.bookingTime)} • {booking.partySize} guests
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                                                        {getStatusIcon(booking.status)}
                                                        <span className="ml-1 capitalize">{booking.status}</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setSelectedBooking(booking)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                {booking.status === 'pending' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(booking.id, 'confirmed')}
                                                    >
                                                        Confirm
                                                    </Button>
                                                )}
                                                {booking.status === 'confirmed' && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleStatusUpdate(booking.id, 'completed')}
                                                    >
                                                        Complete
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        No bookings for today
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Booking Details Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold">Booking Details</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedBooking(null)}
                            >
                                ×
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <p className="text-sm text-gray-500">Customer Name</p>
                                <p className="font-medium">{selectedBooking.customerName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Party Size</p>
                                <p className="font-medium">{selectedBooking.partySize} guests</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium">{selectedBooking.email || "Not provided"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium">{selectedBooking.phone || "Not provided"}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Booking Time</p>
                                <p className="font-medium">{formatDateTime(selectedBooking.bookingTime)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                                    {getStatusIcon(selectedBooking.status)}
                                    <span className="ml-1 capitalize">{selectedBooking.status}</span>
                                </span>
                            </div>
                        </div>

                        {selectedBooking.specialRequest && (
                            <div className="mb-6">
                                <p className="text-sm text-gray-500">Special Request</p>
                                <p className="font-medium">{selectedBooking.specialRequest}</p>
                            </div>
                        )}

                        <div className="flex justify-end space-x-3">
                            {selectedBooking.status === 'pending' && (
                                <Button
                                    onClick={() => {
                                        handleStatusUpdate(selectedBooking.id, 'confirmed');
                                        setSelectedBooking(null);
                                    }}
                                >
                                    Confirm Booking
                                </Button>
                            )}
                            {selectedBooking.status === 'confirmed' && (
                                <Button
                                    onClick={() => {
                                        handleStatusUpdate(selectedBooking.id, 'completed');
                                        setSelectedBooking(null);
                                    }}
                                >
                                    Mark Completed
                                </Button>
                            )}
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    handleDeleteBooking(selectedBooking.id);
                                }}
                            >
                                Delete Booking
                            </Button>
                            <Button variant="outline" onClick={() => setSelectedBooking(null)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Booking Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold">Create New Booking</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCreateModal(false)}
                            >
                                ×
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Customer Name *</label>
                                <Input
                                    value={newBooking.customerName}
                                    onChange={(e) => setNewBooking(prev => ({ ...prev, customerName: e.target.value }))}
                                    placeholder="Enter customer name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <Input
                                    type="email"
                                    value={newBooking.email}
                                    onChange={(e) => setNewBooking(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter email"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <Input
                                    value={newBooking.phone}
                                    onChange={(e) => setNewBooking(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="Enter phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Party Size</label>
                                <Input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={newBooking.partySize}
                                    onChange={(e) => setNewBooking(prev => ({ ...prev, partySize: parseInt(e.target.value) || 1 }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Booking Date & Time *</label>
                                <Input
                                    type="datetime-local"
                                    value={newBooking.bookingTime}
                                    onChange={(e) => setNewBooking(prev => ({ ...prev, bookingTime: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Special Request</label>
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none"
                                    rows={3}
                                    value={newBooking.specialRequest}
                                    onChange={(e) => setNewBooking(prev => ({ ...prev, specialRequest: e.target.value }))}
                                    placeholder="Any special requests..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateBooking}>
                                Create Booking
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 