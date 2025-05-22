"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
//import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCategories, getMenuItems } from "@/lib/actions/menu-actions";
import { createPromotion } from "@/lib/actions/promotion-action";
import { toast } from "sonner";

export default function NewPromotion() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [promotionType, setPromotionType] = useState("PERCENTAGE_DISCOUNT");
    const [value, setValue] = useState("");
    const [minimumOrderValue, setMinimumOrderValue] = useState("");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const [isActive, setIsActive] = useState(false);
    const [couponCode, setCouponCode] = useState("");
    const [usageLimit, setUsageLimit] = useState("");
    const [freeItemId, setFreeItemId] = useState("");
    const [applyToAllItems, setApplyToAllItems] = useState(true);
    const [selectedMenuItems, setSelectedMenuItems] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    // Data state
    const [menuItems, setMenuItems] = useState<Array<{ id: string; name: string }>>([]);
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
    const [isLoadingMenuItems, setIsLoadingMenuItems] = useState(false);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login?callbackUrl=/admin/menu/promotions/new");
            return;
        }

        if (status === "authenticated") {
            if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
                router.push("/admin");
                return;
            }

            // Fetch menu items and categories
            const fetchMenuData = async () => {
                setIsLoadingMenuItems(true);
                setIsLoadingCategories(true);

                try {
                    // Fetch menu items
                    const menuItemsResult = await getMenuItems();
                    if (menuItemsResult.menuItems) {
                        const formattedItems = menuItemsResult.menuItems.map(item => ({
                            id: item.id,
                            name: item.name
                        }));
                        setMenuItems(formattedItems);
                    } else if (menuItemsResult.error) {
                        console.error("Error fetching menu items:", menuItemsResult.error);
                    }
                    setIsLoadingMenuItems(false);

                    // Fetch categories
                    const categoriesResult = await getCategories();
                    if (categoriesResult.categories) {
                        const formattedCategories = categoriesResult.categories.map((category: { id: string; name: string }) => ({
                            id: category.id,
                            name: category.name
                        }));
                        setCategories(formattedCategories);
                    } else if (categoriesResult.error) {
                        console.error("Error fetching categories:", categoriesResult.error);
                    }
                    setIsLoadingCategories(false);
                } catch (error) {
                    console.error("Error fetching menu data:", error);
                    setIsLoadingMenuItems(false);
                    setIsLoadingCategories(false);
                }
            };

            fetchMenuData();
            setIsLoading(false);
        }
    }, [status, session, router]);

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

            // Call the server action to create the promotion
            const result = await createPromotion({
                name,
                description: description || null,
                promotionType,
                value: parseFloat(value),
                minimumOrderValue: minimumOrderValue ? parseFloat(minimumOrderValue) : null,
                startDate,
                endDate,
                isActive,
                couponCode: couponCode || null,
                usageLimit: usageLimit ? parseInt(usageLimit) : null,
                freeItemId: freeItemId || null,
                applyToAllItems,
                menuItemIds: selectedMenuItems.length > 0 ? selectedMenuItems : undefined,
                categoryIds: selectedCategories.length > 0 ? selectedCategories : undefined
            });

            if (result.error) {
                setErrorMessage(result.error);
                setIsSubmitting(false);
                return;
            }

            // Success - show toast and redirect to promotions list
            toast.success("Promotion created successfully!");
            router.push("/admin/menu?tab=promotions");
        } catch (error) {
            console.error("Error creating promotion:", error);
            setErrorMessage("An error occurred while creating the promotion");
            setIsSubmitting(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 px-4 mx-auto">
            <div className="flex items-center mb-8">
                <Link href="/admin/menu?tab=promotions" className="mr-4">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Add New Promotion</h1>
                    <p className="text-gray-600 mt-1">Create a special offer or discount for your customers</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Promotion Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            {errorMessage}
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
                                        Maximum number of times this promotion can be used. Leave blank for unlimited.
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
                                                {isLoadingMenuItems ? (
                                                    <div className="p-2 text-center">
                                                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                                        <span className="text-sm">Loading items...</span>
                                                    </div>
                                                ) : menuItems.length > 0 ? (
                                                    menuItems.map((item) => (
                                                        <SelectItem key={item.id} value={item.id}>
                                                            {item.name}
                                                        </SelectItem>
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-center text-sm text-gray-500">
                                                        No menu items available
                                                    </div>
                                                )}
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
                                    <p className="text-xs text-gray-500 mt-1">
                                        Minimum order subtotal required to apply this promotion
                                    </p>
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
                                                {isLoadingCategories ? (
                                                    <div className="p-2 text-center">
                                                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                                        <span className="text-sm">Loading categories...</span>
                                                    </div>
                                                ) : categories.length > 0 ? (
                                                    categories.map((category) => (
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
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-center text-sm text-gray-500">
                                                        No categories available
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Select Menu Items
                                            </label>
                                            <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-md p-2">
                                                {isLoadingMenuItems ? (
                                                    <div className="p-2 text-center">
                                                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                                        <span className="text-sm">Loading items...</span>
                                                    </div>
                                                ) : menuItems.length > 0 ? (
                                                    menuItems.map((item) => (
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
                                                    ))
                                                ) : (
                                                    <div className="p-2 text-center text-sm text-gray-500">
                                                        No menu items available
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {selectedCategories.length === 0 && selectedMenuItems.length === 0 && !applyToAllItems && (
                                            <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md">
                                                Please select at least one category or menu item, or choose to apply to all items
                                            </div>
                                        )}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Link href="/admin/menu?tab=promotions">
                                <Button variant="outline" type="button">Cancel</Button>
                            </Link>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Promotion"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}