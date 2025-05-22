"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategories, getMenuItems } from "@/lib/actions/menu-actions";
import { getPromotion, updatePromotion, deletePromotion } from "@/lib/actions/promotion-action";

interface EditPromotionProps {
    params: Promise<{ id: string }>;
}

// Define these interfaces for the mappings later on
interface MenuItemBasic {
    id: string;
    name: string;
}

interface CategoryBasic {
    id: string;
    name: string;
}

export default function EditPromotion({ params }: EditPromotionProps) {
    const resolvedParams = React.use(params);
    const id = resolvedParams.id;

    const router = useRouter();
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [promotionType, setPromotionType] = useState("PERCENTAGE_DISCOUNT");
    const [value, setValue] = useState("");
    const [minimumOrderValue, setMinimumOrderValue] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isActive, setIsActive] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [usageLimit, setUsageLimit] = useState("");
    const [usageCount, setUsageCount] = useState(0);
    const [freeItemId, setFreeItemId] = useState("");
    const [applyToAllItems, setApplyToAllItems] = useState(true);
    const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Data for dropdowns
    const [menuItems, setMenuItems] = useState<Array<{ id: string; name: string }>>([]);
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push(`/login?callbackUrl=/admin/menu/promotions/${id}`);
            return;
        }

        if (status === "authenticated") {
            if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
                router.push("/admin");
                return;
            }

            // Fetch the promotion data and available menu items/categories
            const fetchData = async () => {
                try {
                    const [promotionResult, menuItemsResult, categoriesResult] = await Promise.all([
                        getPromotion(id),
                        getMenuItems(),
                        getCategories()
                    ]);

                    // Set menu items
                    if (menuItemsResult.menuItems) {
                        const formattedItems = menuItemsResult.menuItems.map((item: Record<string, unknown>) => ({
                            id: item.id as string,
                            name: item.name as string
                        }));
                        setMenuItems(formattedItems);
                    } else if (menuItemsResult.error) {
                        console.error("Error fetching menu items:", menuItemsResult.error);
                    }

                    // Set categories
                    if (categoriesResult.categories) {
                        const formattedCategories = categoriesResult.categories.map((category: Record<string, unknown>) => ({
                            id: category.id as string,
                            name: category.name as string
                        }));
                        setCategories(formattedCategories);
                    } else if (categoriesResult.error) {
                        console.error("Error fetching categories:", categoriesResult.error);
                    }

                    // Set promotion data
                    if (promotionResult.promotion) {
                        const data = promotionResult.promotion;

                        // Set form values from fetched data
                        setName(data.name);
                        setDescription(data.description || "");
                        setPromotionType(data.promotionType);
                        setValue(data.value?.toString() || "0");
                        setMinimumOrderValue(data.minimumOrderValue?.toString() || "");
                        setStartDate(new Date(data.startDate).toISOString().split('T')[0]);
                        setEndDate(new Date(data.endDate).toISOString().split('T')[0]);
                        setIsActive(data.isActive);
                        setCouponCode(data.couponCode || "");
                        setUsageLimit(data.usageLimit?.toString() || "");
                        setUsageCount(data.usageCount || 0);
                        setFreeItemId(data.freeItemId || "");
                        setApplyToAllItems(data.applyToAllItems);

                        if (data.menuItems && data.menuItems.length > 0) {
                            setSelectedMenuItems(data.menuItems.map((item: MenuItemBasic) => item.id));
                        }

                        if (data.categories && data.categories.length > 0) {
                            setSelectedCategories(data.categories.map((cat: CategoryBasic) => cat.id));
                        }
                    } else if (promotionResult.error) {
                        setErrorMessage("Failed to load promotion data: " + promotionResult.error);
                    }

                    setIsLoading(false);
                } catch (error) {
                    console.error("Error fetching data:", error);
                    setErrorMessage("Failed to load data");
                    setIsLoading(false);
                }
            };

            fetchData();
        }
    }, [id, status, session, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        try {
            // Validate form
            if (!name || !promotionType || !value || !startDate || !endDate) {
                setErrorMessage("Please fill in all required fields");
                setIsSubmitting(false);
                return;
            }

            // If FREE_ITEM type is selected, ensure an item is selected
            if (promotionType === "FREE_ITEM" && !freeItemId) {
                setErrorMessage("Please select a free item for this promotion");
                setIsSubmitting(false);
                return;
            }

            // If applying to specific items/categories, ensure at least one is selected
            if (!applyToAllItems && selectedMenuItems.length === 0 && selectedCategories.length === 0) {
                setErrorMessage("Please select at least one item or category");
                setIsSubmitting(false);
                return;
            }

            // Update the promotion
            const result = await updatePromotion(id, {
                name,
                description,
                promotionType,
                value: parseFloat(value),
                minimumOrderValue: minimumOrderValue ? parseFloat(minimumOrderValue) : null,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                isActive,
                couponCode: couponCode || null,
                usageLimit: usageLimit ? parseInt(usageLimit) : null,
                freeItemId: freeItemId || null,
                applyToAllItems,
                menuItemIds: applyToAllItems ? [] : selectedMenuItems,
                categoryIds: applyToAllItems ? [] : selectedCategories
            });

            if (result.error) {
                setErrorMessage(result.error);
                setIsSubmitting(false);
                return;
            }

            // Success - redirect to promotions list
            router.push("/admin/menu?tab=promotions");
        } catch (error) {
            console.error("Error updating promotion:", error);
            setErrorMessage("An error occurred while updating the promotion");
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setErrorMessage("");

        try {
            const result = await deletePromotion(id);

            if (result.error) {
                setErrorMessage(result.error);
                setIsDeleting(false);
                setDeleteConfirmOpen(false);
                return;
            }

            // Success - redirect to promotions list
            router.push("/admin/menu?tab=promotions");
        } catch (error) {
            console.error("Error deleting promotion:", error);
            setErrorMessage("An error occurred while deleting the promotion");
            setIsDeleting(false);
            setDeleteConfirmOpen(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading promotion...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 px-4 mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <Link href="/admin/menu?tab=promotions" className="mr-4">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Promotion</h1>
                        <p className="text-gray-600 mt-1">Update details for this promotion</p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={isDeleting}
                >
                    {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Promotion
                </Button>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete this promotion? This action cannot be undone.
                        </p>
                        {errorMessage && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                                {errorMessage}
                            </div>
                        )}
                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteConfirmOpen(false)}
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

            <Card>
                <CardHeader>
                    <CardTitle>Promotion Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {errorMessage && !deleteConfirmOpen && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            {errorMessage}
                        </div>
                    )}

                    {usageCount > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md">
                            This promotion has been used {usageCount} times.
                            {usageLimit && ` Usage limit: ${usageCount}/${usageLimit}`}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Tabs defaultValue="basic" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="basic">Basic Details</TabsTrigger>
                                <TabsTrigger value="rules">Promotion Rules</TabsTrigger>
                                <TabsTrigger value="items">Applicable Items</TabsTrigger>
                            </TabsList>

                            {/* Basic Details Tab */}
                            <TabsContent value="basic" className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Promotion Name *
                                    </label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        rows={3}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                                            Start Date *
                                        </label>
                                        <Input
                                            id="startDate"
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                                            End Date *
                                        </label>
                                        <Input
                                            id="endDate"
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="isActive"
                                            checked={isActive}
                                            onCheckedChange={setIsActive}
                                        />
                                        <Label htmlFor="isActive">Make promotion active</Label>
                                    </div>
                                    <p className="text-sm text-gray-500 ml-9">
                                        Inactive promotions will not be applied to orders
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="couponCode" className="block text-sm font-medium text-gray-700 mb-1">
                                        Coupon Code
                                    </label>
                                    <Input
                                        id="couponCode"
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        className="w-full"
                                        placeholder="e.g. SUMMER20"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Leave blank if no code is required to apply this promotion
                                    </p>
                                </div>

                                <div>
                                    <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 mb-1">
                                        Usage Limit
                                    </label>
                                    <Input
                                        id="usageLimit"
                                        type="number"
                                        value={usageLimit}
                                        onChange={(e) => setUsageLimit(e.target.value)}
                                        className="w-full"
                                        min="1"
                                        placeholder="Unlimited"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Maximum number of times this promotion can be used
                                    </p>
                                </div>
                            </TabsContent>

                            {/* Rules Tab */}
                            <TabsContent value="rules" className="space-y-4">
                                <div>
                                    <label htmlFor="promotionType" className="block text-sm font-medium text-gray-700 mb-1">
                                        Promotion Type *
                                    </label>
                                    <Select
                                        value={promotionType}
                                        onValueChange={setPromotionType}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a promotion type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PERCENTAGE_DISCOUNT">Percentage Discount</SelectItem>
                                            <SelectItem value="FIXED_AMOUNT_DISCOUNT">Fixed Amount Discount</SelectItem>
                                            <SelectItem value="FREE_ITEM">Free Item</SelectItem>
                                            <SelectItem value="BUY_ONE_GET_ONE">Buy One Get One</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {promotionType === "PERCENTAGE_DISCOUNT" && (
                                    <div>
                                        <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                                            Discount Percentage *
                                        </label>
                                        <div className="relative">
                                            <Input
                                                id="value"
                                                type="number"
                                                value={value}
                                                onChange={(e) => setValue(e.target.value)}
                                                className="w-full pr-8"
                                                min="1"
                                                max="100"
                                                required
                                            />
                                            <span className="absolute right-3 top-2">%</span>
                                        </div>
                                    </div>
                                )}

                                {promotionType === "FIXED_AMOUNT_DISCOUNT" && (
                                    <div>
                                        <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                                            Discount Amount *
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2">$</span>
                                            <Input
                                                id="value"
                                                type="number"
                                                value={value}
                                                onChange={(e) => setValue(e.target.value)}
                                                className="w-full pl-8"
                                                min="0.01"
                                                step="0.01"
                                                required
                                            />
                                        </div>
                                    </div>
                                )}

                                {promotionType === "FREE_ITEM" && (
                                    <div>
                                        <label htmlFor="freeItemId" className="block text-sm font-medium text-gray-700 mb-1">
                                            Select Free Item *
                                        </label>
                                        <Select
                                            value={freeItemId}
                                            onValueChange={setFreeItemId}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select an item" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {menuItems.map((item) => (
                                                    <SelectItem key={item.id} value={item.id}>
                                                        {item.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {promotionType === "BUY_ONE_GET_ONE" && (
                                    <div>
                                        <p className="text-sm text-gray-600 mb-2">
                                            This promotion will allow customers to get two items for the price of one
                                        </p>
                                        <Input
                                            id="value"
                                            type="hidden"
                                            value={value || "1"}
                                            onChange={(e) => setValue(e.target.value)}
                                        />
                                    </div>
                                )}

                                <div>
                                    <label htmlFor="minimumOrderValue" className="block text-sm font-medium text-gray-700 mb-1">
                                        Minimum Order Value
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2">$</span>
                                        <Input
                                            id="minimumOrderValue"
                                            type="number"
                                            value={minimumOrderValue}
                                            onChange={(e) => setMinimumOrderValue(e.target.value)}
                                            className="w-full pl-8"
                                            min="0.01"
                                            step="0.01"
                                            placeholder="No minimum"
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            {/* Applicable Items Tab */}
                            <TabsContent value="items" className="space-y-4">
                                <div className="flex flex-col space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="applyToAllItems"
                                            checked={applyToAllItems}
                                            onCheckedChange={setApplyToAllItems}
                                        />
                                        <Label htmlFor="applyToAllItems">Apply to all menu items</Label>
                                    </div>
                                    <p className="text-sm text-gray-500 ml-9">
                                        If disabled, you can select specific categories or items below
                                    </p>
                                </div>

                                {!applyToAllItems && (
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Categories
                                            </label>
                                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
                                                {categories.map((category) => (
                                                    <div key={category.id} className="flex items-center space-x-2 py-1">
                                                        <Checkbox
                                                            id={`category-${category.id}`}
                                                            checked={selectedCategories.includes(category.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedCategories([...selectedCategories, category.id]);
                                                                } else {
                                                                    setSelectedCategories(
                                                                        selectedCategories.filter((id) => id !== category.id)
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor={`category-${category.id}`} className="text-sm text-gray-700">
                                                            {category.name}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Menu Items
                                            </label>
                                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
                                                {menuItems.map((item) => (
                                                    <div key={item.id} className="flex items-center space-x-2 py-1">
                                                        <Checkbox
                                                            id={`item-${item.id}`}
                                                            checked={selectedMenuItems.includes(item.id)}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedMenuItems([...selectedMenuItems, item.id]);
                                                                } else {
                                                                    setSelectedMenuItems(
                                                                        selectedMenuItems.filter((id) => id !== item.id)
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor={`item-${item.id}`} className="text-sm text-gray-700">
                                                            {item.name}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Link href="/admin/menu?tab=promotions">
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}