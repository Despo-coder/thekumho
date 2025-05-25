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
    UserPlus,
    UserX,
    UserCheck,
    RotateCcw,
    Shield,
    Users,
    UserCog,
    Calendar,
    Phone,
    Mail,
    X
} from "lucide-react";
import {
    getUserStats,
    getUsers,
    createUser,
    deactivateUser,
    reactivateUser,
    resetUserPassword,
    getUserAuditLog
} from "@/lib/actions/user-management-actions";
import { Role, UserStatus } from "@prisma/client";

// Type definitions
type UserWithDetails = {
    id: string;
    name: string | null;
    email: string;
    role: Role;
    status: UserStatus;
    employeeId: string | null;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    hireDate: Date | null;
    lastLogin: Date | null;
    isActive: boolean;
    createdAt: Date;
    createdBy?: {
        id: string;
        name: string | null;
        email: string;
    } | null;
    _count?: {
        orders: number;
        auditLogs: number;
        sessions: number;
    };
};

type UserStats = {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    suspendedUsers: number;
    adminUsers: number;
    managerUsers: number;
    chefUsers: number;
    waiterUsers: number;
    customerUsers: number;
    newUsersThisMonth: number;
};

type CreateUserData = {
    email: string;
    firstName: string;
    lastName: string;
    role: Role;
    employeeId?: string;
    phone?: string;
    hireDate?: Date;
    sendInvitation?: boolean;
};

type AuditLog = {
    id: string;
    action: string;
    createdAt: Date;
    performedBy: {
        id: string;
        name: string | null;
        email: string;
    };
};

export default function UserManagement() {
    const [users, setUsers] = useState<UserWithDetails[]>([]);
    const [stats, setStats] = useState<UserStats>({
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        suspendedUsers: 0,
        adminUsers: 0,
        managerUsers: 0,
        chefUsers: 0,
        waiterUsers: 0,
        customerUsers: 0,
        newUsersThisMonth: 0,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<Role | "">("");
    const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
    const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showUserDetails, setShowUserDetails] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [activeTab, setActiveTab] = useState("all");

    // New user form state
    const [newUser, setNewUser] = useState<CreateUserData>({
        email: "",
        firstName: "",
        lastName: "",
        role: "WAITER",
        employeeId: "",
        phone: "",
        sendInvitation: true,
    });

    // User audit logs
    const [userAuditLogs, setUserAuditLogs] = useState<AuditLog[]>([]);
    const [isLoadingAudit, setIsLoadingAudit] = useState(false);

    const fetchUsers = useCallback(async (page: number = 1) => {
        try {
            setIsRefreshing(true);
            const result = await getUsers({
                page,
                limit: 20,
                role: roleFilter || undefined,
                status: statusFilter || undefined,
                search: searchTerm || undefined,
                includeCustomers: activeTab === "customers",
            });

            if (result.success && result.data) {
                setUsers(result.data.users);
                setTotalCount(result.data.totalCount);
                setTotalPages(result.data.totalPages);
            } else {
                console.error("Failed to fetch users:", result.error);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    }, [roleFilter, statusFilter, searchTerm, activeTab]);

    const fetchStats = useCallback(async () => {
        try {
            const result = await getUserStats();
            if (result.success && result.data) {
                setStats(result.data);
            }
        } catch (error) {
            console.error("Error fetching user stats:", error);
        }
    }, []);

    const fetchUserAuditLog = useCallback(async (userId: string) => {
        try {
            setIsLoadingAudit(true);
            const result = await getUserAuditLog(userId, 1, 10);
            if (result.success && result.data) {
                setUserAuditLogs(result.data.logs);
            }
        } catch (error) {
            console.error("Error fetching audit log:", error);
        } finally {
            setIsLoadingAudit(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers(currentPage);
        fetchStats();
    }, [fetchUsers, fetchStats, currentPage]);

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            if (searchTerm !== "") {
                setCurrentPage(1);
                fetchUsers(1);
            } else if (searchTerm === "") {
                fetchUsers(currentPage);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchTerm, currentPage, fetchUsers]);

    const handleCreateUser = async () => {
        try {
            if (!newUser.email || !newUser.firstName || !newUser.lastName) {
                alert("Please fill in required fields (email, first name, last name)");
                return;
            }

            const result = await createUser({
                ...newUser,
                hireDate: newUser.hireDate ? new Date(newUser.hireDate) : undefined,
            });

            if (result.success) {
                setShowCreateModal(false);
                setNewUser({
                    email: "",
                    firstName: "",
                    lastName: "",
                    role: "WAITER",
                    employeeId: "",
                    phone: "",
                    sendInvitation: true,
                });
                await Promise.all([fetchUsers(currentPage), fetchStats()]);
                alert("User created successfully!");
            } else {
                alert("Failed to create user: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error("Error creating user:", error);
            alert("An error occurred while creating the user.");
        }
    };

    const handleUserAction = async (action: string, userId: string, reason?: string) => {
        try {
            let result;
            switch (action) {
                case "deactivate":
                    result = await deactivateUser(userId, reason);
                    break;
                case "reactivate":
                    result = await reactivateUser(userId);
                    break;
                case "resetPassword":
                    result = await resetUserPassword(userId);
                    if (result.success && result.data) {
                        alert(`Password reset successfully. New temporary password: ${result.data.tempPassword}`);
                    }
                    break;
                default:
                    return;
            }

            if (result.success) {
                await Promise.all([fetchUsers(currentPage), fetchStats()]);
                if (selectedUser?.id === userId) {
                    // Refresh selected user data
                    const updatedUsers = await getUsers({ page: 1, limit: 1, search: selectedUser.email });
                    if (updatedUsers.success && updatedUsers.data?.users[0]) {
                        setSelectedUser(updatedUsers.data.users[0]);
                    }
                }
            } else {
                alert("Failed to perform action: " + (result.error || "Unknown error"));
            }
        } catch (error) {
            console.error(`Error performing ${action}:`, error);
            alert(`An error occurred while performing the action.`);
        }
    };

    const getStatusColor = (status: UserStatus) => {
        switch (status) {
            case 'ACTIVE':
                return "bg-green-100 text-green-800";
            case 'INACTIVE':
                return "bg-gray-100 text-gray-800";
            case 'SUSPENDED':
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getRoleColor = (role: Role) => {
        switch (role) {
            case 'ADMIN':
                return "bg-purple-100 text-purple-800";
            case 'MANAGER':
                return "bg-blue-100 text-blue-800";
            case 'CHEF':
                return "bg-orange-100 text-orange-800";
            case 'WAITER':
                return "bg-green-100 text-green-800";
            case 'USER':
                return "bg-gray-100 text-gray-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const formatDateTime = (date: Date | null) => {
        if (!date) return "Never";
        return new Date(date).toLocaleString();
    };

    const formatDate = (date: Date | null) => {
        if (!date) return "Not set";
        return new Date(date).toLocaleDateString();
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-2 text-gray-600">Loading users...</p>
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
                        <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            +{stats.newUsersThisMonth} this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                        <UserCheck className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.inactiveUsers} inactive
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <Shield className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.adminUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.managerUsers} managers
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Staff</CardTitle>
                        <UserCog className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.chefUsers + stats.waiterUsers}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.chefUsers} chefs, {stats.waiterUsers} waiters
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All Staff</TabsTrigger>
                    <TabsTrigger value="customers">Customers</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Staff Management</CardTitle>
                                <Button onClick={() => setShowCreateModal(true)}>
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Add Staff Member
                                </Button>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <select
                                        value={roleFilter}
                                        onChange={(e) => setRoleFilter(e.target.value as Role | "")}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="">All Roles</option>
                                        <option value="ADMIN">Admin</option>
                                        <option value="MANAGER">Manager</option>
                                        <option value="CHEF">Chef</option>
                                        <option value="WAITER">Waiter</option>
                                    </select>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value as UserStatus | "")}
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="INACTIVE">Inactive</option>
                                        <option value="SUSPENDED">Suspended</option>
                                    </select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => fetchUsers(currentPage)}
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
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Last Login
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {users.length > 0 ? (
                                            users.map((user) => (
                                                <tr key={user.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {user.firstName} {user.lastName}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {user.email}
                                                            </div>
                                                            {user.employeeId && (
                                                                <div className="text-xs text-gray-400">
                                                                    ID: {user.employeeId}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                                                            {user.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDateTime(user.lastLogin)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedUser(user);
                                                                    setShowUserDetails(true);
                                                                    fetchUserAuditLog(user.id);
                                                                }}
                                                                title="View Details"
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            {user.status === 'ACTIVE' ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleUserAction('deactivate', user.id)}
                                                                    title="Deactivate User"
                                                                >
                                                                    <UserX className="h-4 w-4 text-red-500" />
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleUserAction('reactivate', user.id)}
                                                                    title="Reactivate User"
                                                                >
                                                                    <UserCheck className="h-4 w-4 text-green-500" />
                                                                </Button>
                                                            )}
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleUserAction('resetPassword', user.id)}
                                                                title="Reset Password"
                                                            >
                                                                <RotateCcw className="h-4 w-4 text-blue-500" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                    {searchTerm || roleFilter || statusFilter ? "No users match your filters" : "No users found"}
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
                                        Showing {Math.min((currentPage - 1) * 20 + 1, totalCount)} to {Math.min(currentPage * 20, totalCount)} of {totalCount} users
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

                <TabsContent value="customers">
                    <Card>
                        <CardHeader>
                            <CardTitle>Customer Management</CardTitle>
                            <p className="text-sm text-gray-600">View and manage customer accounts</p>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-gray-500">
                                Customer management interface will be implemented here.
                                <br />
                                This will show registered customers and their order history.
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold">Add New Staff Member</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowCreateModal(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">First Name *</label>
                                    <Input
                                        value={newUser.firstName}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, firstName: e.target.value }))}
                                        placeholder="Enter first name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Last Name *</label>
                                    <Input
                                        value={newUser.lastName}
                                        onChange={(e) => setNewUser(prev => ({ ...prev, lastName: e.target.value }))}
                                        placeholder="Enter last name"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email *</label>
                                <Input
                                    type="email"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter email address"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Role *</label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as Role }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="WAITER">Waiter</option>
                                    <option value="CHEF">Chef</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Employee ID</label>
                                <Input
                                    value={newUser.employeeId}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, employeeId: e.target.value }))}
                                    placeholder="Enter employee ID (optional)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone</label>
                                <Input
                                    value={newUser.phone}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="Enter phone number (optional)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Hire Date</label>
                                <Input
                                    type="date"
                                    value={newUser.hireDate ? new Date(newUser.hireDate).toISOString().split('T')[0] : ''}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, hireDate: e.target.value ? new Date(e.target.value) : undefined }))}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="sendInvitation"
                                    checked={newUser.sendInvitation}
                                    onChange={(e) => setNewUser(prev => ({ ...prev, sendInvitation: e.target.checked }))}
                                    className="rounded"
                                />
                                <label htmlFor="sendInvitation" className="text-sm">
                                    Send invitation email with temporary password
                                </label>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreateUser}>
                                Create User
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Details Modal */}
            {showUserDetails && selectedUser && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold">User Details</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUserDetails(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* User Information */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900">Personal Information</h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">Full Name</p>
                                        <p className="font-medium">{selectedUser.firstName} {selectedUser.lastName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium flex items-center">
                                            <Mail className="h-4 w-4 mr-2" />
                                            {selectedUser.email}
                                        </p>
                                    </div>
                                    {selectedUser.phone && (
                                        <div>
                                            <p className="text-sm text-gray-500">Phone</p>
                                            <p className="font-medium flex items-center">
                                                <Phone className="h-4 w-4 mr-2" />
                                                {selectedUser.phone}
                                            </p>
                                        </div>
                                    )}
                                    {selectedUser.employeeId && (
                                        <div>
                                            <p className="text-sm text-gray-500">Employee ID</p>
                                            <p className="font-medium">{selectedUser.employeeId}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-500">Role</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(selectedUser.role)}`}>
                                            {selectedUser.role}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedUser.status)}`}>
                                            {selectedUser.status}
                                        </span>
                                    </div>
                                    {selectedUser.hireDate && (
                                        <div>
                                            <p className="text-sm text-gray-500">Hire Date</p>
                                            <p className="font-medium flex items-center">
                                                <Calendar className="h-4 w-4 mr-2" />
                                                {formatDate(selectedUser.hireDate)}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-500">Last Login</p>
                                        <p className="font-medium">{formatDateTime(selectedUser.lastLogin)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Member Since</p>
                                        <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                                    </div>
                                    {selectedUser.createdBy && (
                                        <div>
                                            <p className="text-sm text-gray-500">Created By</p>
                                            <p className="font-medium">{selectedUser.createdBy.name || selectedUser.createdBy.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Activity & Stats */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900">Activity & Statistics</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{selectedUser._count?.orders || 0}</div>
                                        <div className="text-xs text-gray-500">Orders</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{selectedUser._count?.sessions || 0}</div>
                                        <div className="text-xs text-gray-500">Sessions</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-orange-600">{selectedUser._count?.auditLogs || 0}</div>
                                        <div className="text-xs text-gray-500">Actions</div>
                                    </div>
                                </div>

                                <div>
                                    <h5 className="font-medium text-gray-900 mb-3">Recent Activity</h5>
                                    {isLoadingAudit ? (
                                        <div className="flex items-center justify-center py-4">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                    ) : userAuditLogs.length > 0 ? (
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {userAuditLogs.map((log) => (
                                                <div key={log.id} className="text-sm p-2 bg-gray-50 rounded">
                                                    <div className="font-medium">{log.action}</div>
                                                    <div className="text-gray-500">
                                                        by {log.performedBy.name || log.performedBy.email}
                                                    </div>
                                                    <div className="text-xs text-gray-400">
                                                        {formatDateTime(log.createdAt)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No recent activity</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <Button variant="outline" onClick={() => setShowUserDetails(false)}>
                                Close
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleUserAction('resetPassword', selectedUser.id)}
                            >
                                Reset Password
                            </Button>
                            {selectedUser.status === 'ACTIVE' ? (
                                <Button
                                    variant="destructive"
                                    onClick={() => handleUserAction('deactivate', selectedUser.id)}
                                >
                                    Deactivate User
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => handleUserAction('reactivate', selectedUser.id)}
                                >
                                    Reactivate User
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 