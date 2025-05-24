"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, PlusCircle, Search, Edit, Trash2, ChevronLeft, Ticket } from "lucide-react";
//import { Loader2, PlusCircle, Search, Edit, Trash2, ChevronLeft, Calendar, CookingPot, DollarSign, Package, ShoppingBag, Ticket, Users, Utensils } from "lucide-react";
import Link from "next/link";
import { getPromotions } from "@/lib/actions/promotion-action";
import { getCategories, getMenus, getMenuItems, deleteMenuItem, deleteMenu } from "@/lib/actions/menu-actions-reexport";
import Image from "next/image";
import PromotionAnalytics from "@/components/PromotionAnalytics";

// Type definitions
type MenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
    isAvailable: boolean;
    category: {
        id: string;
        name: string;
    };
    menu: {
        id: string;
        name: string;
    };
};

type Category = {
    id: string;
    name: string;
    description: string | null;
};

type Menu = {
    id: string;
    name: string;
    description: string | null;
    isActive: boolean;
    isPickup: boolean;
    _count?: {
        items: number;
    };
};

type Promotion = {
    id: string;
    name: string;
    description: string | null;
    promotionType: string;
    value: number;
    minimumOrderValue: number | null;
    startDate: string | Date;
    endDate: string | Date;
    isActive: boolean;
    couponCode: string | null;
    usageCount: number;
    usageLimit: number | null;
    freeItemId: string | null;
    applyToAllItems: boolean;
    [key: string]: string | number | boolean | null | Date | Record<string, unknown> | unknown[];
};

export default function MenuManagement() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("items");
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Delete state
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [itemTypeToDelete, setItemTypeToDelete] = useState<'menu-item' | 'category' | 'menu' | 'promotion'>('menu-item');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    // Data states
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [menus, setMenus] = useState<Menu[]>([]);
    const [filteredItems, setFilteredItems] = useState<MenuItem[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);

    // Fetch data function wrapped in useCallback
    const fetchData = useCallback(async () => {
        try {
            // Only fetch menu items, categories, and menus by default
            const [menuItemsData, categoriesData, menusData] = await Promise.all([
                getMenuItems(),
                getCategories(),
                getMenus(),
            ]);

            if (menuItemsData.menuItems) {
                const mappedItems = mapMenuItems(menuItemsData.menuItems);
                setMenuItems(mappedItems);
                setFilteredItems(mappedItems);
            } else {
                setMenuItems([]);
                setFilteredItems([]);
                console.error("Menu items data structure issue:", menuItemsData);
            }

            if (categoriesData.categories) {
                setCategories(categoriesData.categories);
            }

            if (menusData.menus) {
                setMenus(menusData.menus);
            }

            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching menu data:", error);
            setIsLoading(false);
        }
    }, []); // Empty dependency array as it doesn't depend on any props or state

    // Separate function to fetch promotions data only when needed
    const fetchPromotionsData = useCallback(async () => {
        try {
            const promotionsData = await getPromotions();

            if (promotionsData.promotions) {
                try {
                    // Use JSON serialization trick to convert Decimal objects to plain numbers
                    const jsonString = JSON.stringify(promotionsData.promotions);
                    const parsedPromotions = JSON.parse(jsonString);

                    // Ensure all values have proper defaults
                    const safePromotions = parsedPromotions.map((promo: Record<string, unknown>) => ({
                        ...promo,
                        value: typeof promo.value === 'number' ? promo.value : 0,
                        minimumOrderValue: promo.minimumOrderValue !== undefined ? promo.minimumOrderValue : null
                    }));

                    setPromotions(safePromotions as Promotion[]);
                } catch (error) {
                    console.error("Error processing promotions data:", error);
                    setPromotions([]);
                }
            }
        } catch (error) {
            console.error("Error fetching promotions data:", error);
        }
    }, []);

    useEffect(() => {
        // Check if user is authenticated and has appropriate role
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/admin/menu");
            return;
        }

        if (status === "authenticated") {
            if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
                router.push("/admin");
                return;
            }

            // Fetch all menu data (except promotions)
            fetchData();
        }
    }, [status, session, router, fetchData]);

    // Load promotions data only when the promotions tab is active
    useEffect(() => {
        if (activeTab === "promotions" && status === "authenticated") {
            fetchPromotionsData();
        }
    }, [activeTab, status, fetchPromotionsData]);

    // Filter menu items when search term changes
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredItems(menuItems);
        } else {
            const term = searchTerm.toLowerCase();
            const filtered = menuItems.filter(
                (item) =>
                    item.name.toLowerCase().includes(term) ||
                    (item.description && item.description.toLowerCase().includes(term)) ||
                    item.category.name.toLowerCase().includes(term)
            );
            setFilteredItems(filtered);
        }
    }, [searchTerm, menuItems]);

    // Helper function to map Prisma items to the MenuItem type
    const mapMenuItems = (items: Array<{
        id: string;
        name: string;
        description: string | null;
        price: number | bigint;
        image: string | null;
        isAvailable: boolean;
        category: { id: string; name: string };
        menu: { id: string; name: string };
    }>): MenuItem[] => {
        return items.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: Number(item.price),
            image: item.image,
            isAvailable: item.isAvailable,
            category: {
                id: item.category.id,
                name: item.category.name,
            },
            menu: {
                id: item.menu.id,
                name: item.menu.name,
            }
        }));
    };

    // Handle delete confirmation
    const openDeleteConfirm = (id: string, type: 'menu-item' | 'category' | 'menu' | 'promotion') => {
        setItemToDelete(id);
        setItemTypeToDelete(type);
        setDeleteConfirmOpen(true);
        setDeleteError("");
    };

    // Handle delete item
    const handleDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        setDeleteError("");

        try {
            let result: { error?: string; success?: boolean } = { success: false };

            if (itemTypeToDelete === 'menu-item') {
                result = await deleteMenuItem(itemToDelete);
            } else if (itemTypeToDelete === 'category') {
                // Call delete category API
                const response = await fetch(`/api/categories/${itemToDelete}`, {
                    method: 'DELETE',
                });
                result = await response.json();

                if (!response.ok) {
                    result = { error: result.error || 'Failed to delete category' };
                } else {
                    result = { success: true };
                }
            } else if (itemTypeToDelete === 'menu') {
                // Call delete menu API
                result = await deleteMenu(itemToDelete);
            } else if (itemTypeToDelete === 'promotion') {
                const response = await fetch(`/api/promotions/${itemToDelete}`, {
                    method: 'DELETE',
                });
                result = await response.json();

                if (!response.ok) {
                    result = { error: result.error || 'Failed to delete promotion' };
                } else {
                    result = { success: true };
                }
            }

            if (result.error) {
                setDeleteError(result.error);
                setIsDeleting(false);
            } else {
                // Success - close modal and refresh data
                setIsDeleting(false);
                setDeleteConfirmOpen(false);
                setItemToDelete(null);

                // Fetch updated data
                fetchData();
            }
        } catch (error) {
            console.error(`Error deleting ${itemTypeToDelete}:`, error);
            setDeleteError(`An error occurred while deleting the ${itemTypeToDelete.replace('-', ' ')}. Please try again.`);
            setIsDeleting(false);
        }
    };

    // Add this function to format promotion types
    const formatPromotionType = (type: string): string => {
        switch (type) {
            case "PERCENTAGE_DISCOUNT":
                return "Percentage Off";
            case "FIXED_AMOUNT_DISCOUNT":
                return "Fixed Amount Off";
            case "FREE_ITEM":
                return "Free Item";
            case "BUY_ONE_GET_ONE":
                return "Buy One Get One";
            default:
                return type;
        }
    };

    // Add function to format promotion values
    const formatPromotionValue = (type: string, value: number): string => {
        switch (type) {
            case "PERCENTAGE_DISCOUNT":
                return `${value}%`;
            case "FIXED_AMOUNT_DISCOUNT":
                return `$${value.toFixed(2)}`;
            default:
                return `${value}`;
        }
    };

    // Add function to get status text
    const getStatusText = (promo: Promotion): string => {
        const now = new Date();
        const startDate = new Date(promo.startDate);
        const endDate = new Date(promo.endDate);

        if (!promo.isActive) return "Inactive";
        if (now < startDate) return "Scheduled";
        if (now > endDate) return "Expired";
        return "Active";
    };

    // Add function to get status class
    const getStatusClass = (promo: Promotion): string => {
        const status = getStatusText(promo);
        switch (status) {
            case "Active":
                return "bg-green-100 text-green-800";
            case "Scheduled":
                return "bg-blue-100 text-blue-800";
            case "Expired":
                return "bg-gray-100 text-gray-800";
            case "Inactive":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Add function to format date range
    const formatDateRange = (startDate: string | Date, endDate: string | Date): string => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading menu management...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 px-4 mx-auto">
            <div className="flex items-center mb-8">
                <Link href="/admin" className="mr-4">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Menu Management</h1>
                    <p className="text-gray-600 mt-1">
                        Add, edit, or remove menu items, categories, and menus
                    </p>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete this {itemTypeToDelete.replace('-', ' ')}? This action cannot be undone.
                            {(itemTypeToDelete === 'category' || itemTypeToDelete === 'menu') && (
                                <>
                                    <br /><br />
                                    <strong className="text-red-600">Note:</strong> You cannot delete a {itemTypeToDelete} that has items assigned to it.
                                </>
                            )}
                        </p>
                        {deleteError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                                {deleteError}
                            </div>
                        )}
                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDeleteConfirmOpen(false);
                                    setItemToDelete(null);
                                }}
                                disabled={isDeleting}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Deleting...
                                    </>
                                ) : (
                                    "Delete"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Tabs defaultValue="items" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-8">
                    <TabsTrigger value="items">Menu Items</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="menus">Menus</TabsTrigger>
                    <TabsTrigger value="promotions">Promotions</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="items">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle>Menu Items</CardTitle>
                            <div className="flex space-x-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                    <Input
                                        type="search"
                                        placeholder="Search items..."
                                        className="w-full pl-8 md:w-[300px]"
                                        value={searchTerm}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Link href="/admin/menu/items/new">
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add Item
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Category
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Price
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredItems.length > 0 ? (
                                            filteredItems.map((item) => (
                                                <tr key={item.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            {item.image && (
                                                                <div className="flex-shrink-0 h-10 w-10 mr-3">
                                                                    <Image
                                                                        className="h-10 w-10 rounded-full object-cover"
                                                                        src={item.image}
                                                                        alt={item.name}
                                                                        width={100}
                                                                        height={100}
                                                                    />
                                                                </div>
                                                            )}
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {item.name}
                                                                </div>
                                                                {item.description && (
                                                                    <div className="text-sm text-gray-500 truncate max-w-xs">
                                                                        {item.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {item.category.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        ${Number(item.price).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.isAvailable
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-red-100 text-red-800"
                                                                }`}
                                                        >
                                                            {item.isAvailable ? "Available" : "Unavailable"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <Link href={`/admin/menu/items/${item.id}`}>
                                                                <Button variant="ghost" size="icon">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openDeleteConfirm(item.id, 'menu-item')}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                    {searchTerm
                                                        ? "No items match your search"
                                                        : "No menu items found"}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="categories">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle>Categories</CardTitle>
                            <Link href="/admin/menu/categories/new">
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Category
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {categories.length > 0 ? (
                                            categories.map((category) => (
                                                <tr key={category.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {category.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {category.description || "—"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <Link href={`/admin/menu/categories/${category.id}`}>
                                                                <Button variant="ghost" size="icon">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openDeleteConfirm(category.id, 'category')}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                                    No categories found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="menus">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle>Menus</CardTitle>
                            <Link href="/admin/menu/menus/new">
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Menu
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Description
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Items
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {menus.length > 0 ? (
                                            menus.map((menu) => (
                                                <tr key={menu.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {menu.name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {menu.description || "—"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${menu.isActive
                                                                ? "bg-green-100 text-green-800"
                                                                : "bg-yellow-100 text-yellow-800"
                                                                }`}
                                                        >
                                                            {menu.isActive ? "Active" : "Inactive"}
                                                        </span>
                                                        {menu.isPickup && (
                                                            <span className="ml-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                                Pickup
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
                                                            {menu._count?.items || 0}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <Link href={`/admin/menu/menus/${menu.id}`}>
                                                                <Button variant="ghost" size="icon">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openDeleteConfirm(menu.id, 'menu')}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                    No menus found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="promotions">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle>Promotions</CardTitle>
                            <Link href="/admin/menu/promotions/new">
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Add Promotion
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Value
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Date Range
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {promotions.length > 0 ? (
                                            promotions.map((promo) => (
                                                <tr key={promo.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 mr-3">
                                                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                                                    <Ticket className="h-5 w-5 text-orange-500" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {promo.name}
                                                                </div>
                                                                {promo.couponCode && (
                                                                    <div className="text-xs text-gray-500">
                                                                        Code: <span className="font-mono">{promo.couponCode}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatPromotionType(promo.promotionType)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatPromotionValue(promo.promotionType, promo.value)}
                                                        {promo.minimumOrderValue && (
                                                            <div className="text-xs text-gray-500">
                                                                Min. order: ${Number(promo.minimumOrderValue).toFixed(2)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span
                                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(promo)}`}
                                                        >
                                                            {getStatusText(promo)}
                                                        </span>
                                                        {promo.usageLimit && (
                                                            <div className="text-xs text-gray-500 mt-1">
                                                                Uses: {promo.usageCount}/{promo.usageLimit}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {formatDateRange(promo.startDate, promo.endDate)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <Link href={`/admin/menu/promotions/${promo.id}`}>
                                                                <Button variant="ghost" size="icon">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openDeleteConfirm(promo.id, 'promotion')}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                    No promotions found. Create your first promotion to start offering discounts.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="analytics">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Promotion Analytics</CardTitle>
                                <p className="text-gray-600">Performance overview for your promotions</p>
                            </CardHeader>
                            <CardContent>
                                <PromotionAnalytics />
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
} 