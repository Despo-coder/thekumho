"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, Loader2, ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    getMenuItem,
    updateMenuItem,
    deleteMenuItem,
    getCategories,
    getMenus
} from "@/lib/actions/menu-actions-reexport";
import { UploadButton } from "@/lib/uploadthing";
import React from "react";
import Image from "next/image";

interface EditMenuItemProps {
    params: Promise<{ id: string }>;
}

export default function EditMenuItem({ params }: EditMenuItemProps) {
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
    const [price, setPrice] = useState("");
    const [image, setImage] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [menuId, setMenuId] = useState("");
    const [isAvailable, setIsAvailable] = useState(true);
    const [isVegetarian, setIsVegetarian] = useState(false);
    const [isVegan, setIsVegan] = useState(false);
    const [isPescatarian, setIsPescatarian] = useState(false);
    const [isGlutenFree, setIsGlutenFree] = useState(false);
    const [isDairyFree, setIsDairyFree] = useState(false);
    const [isNutFree, setIsNutFree] = useState(false);
    const [isSpicy, setIsSpicy] = useState(false);

    // Upload status
    const [isUploading, setIsUploading] = useState(false);

    // Data for dropdowns
    const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
    const [menus, setMenus] = useState<Array<{ id: string; name: string; isActive?: boolean }>>([]);

    useEffect(() => {
        // Check if user is authenticated and has appropriate role
        if (status === "unauthenticated") {
            router.push(`/login?callbackUrl=/admin/menu/items/${id}`);
            return;
        }

        if (status === "authenticated") {
            if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
                router.push("/admin");
                return;
            }

            // Fetch the menu item and dropdown data
            const fetchData = async () => {
                try {
                    const [menuItemData, categoriesData, menusData] = await Promise.all([
                        getMenuItem(id),
                        getCategories(),
                        getMenus(),
                    ]);

                    if (menuItemData.error) {
                        setErrorMessage(menuItemData.error);
                        setIsLoading(false);
                        return;
                    }

                    if (menuItemData.menuItem) {
                        const item = menuItemData.menuItem;
                        setName(item.name);
                        setDescription(item.description || "");
                        setPrice(item.price.toString());
                        setImage(item.image || "");
                        setCategoryId(item.categoryId);
                        setMenuId(item.menuId);
                        setIsAvailable(item.isAvailable);
                        setIsVegetarian(item.isVegetarian || false);
                        setIsVegan(item.isVegan || false);
                        setIsPescatarian(item.isPescatarian || false);
                        setIsGlutenFree(item.isGlutenFree || false);
                        setIsDairyFree(item.isDairyFree || false);
                        setIsNutFree(item.isNutFree || false);
                        setIsSpicy(item.isSpicy || false);
                    }

                    if (categoriesData.categories) {
                        setCategories(categoriesData.categories);
                    }

                    if (menusData.menus) {
                        setMenus(menusData.menus);
                    }

                    setIsLoading(false);
                } catch (error) {
                    console.error("Error fetching menu item data:", error);
                    setErrorMessage("Failed to load menu item data. Please try again.");
                    setIsLoading(false);
                }
            };

            fetchData();
        }
    }, [id, status, session, router]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMessage("");

        try {
            // Validate form
            if (!name || !price || !categoryId || !menuId) {
                setErrorMessage("Please fill in all required fields.");
                setIsSubmitting(false);
                return;
            }

            // Update menu item
            const result = await updateMenuItem(id, {
                name,
                description: description || null,
                price: parseFloat(price),
                image: image || null,
                categoryId,
                menuId,
                isAvailable,
                isVegetarian,
                isVegan,
                isPescatarian,
                isGlutenFree,
                isDairyFree,
                isNutFree,
                isSpicy,
            });

            if (result.error) {
                setErrorMessage(result.error);
                setIsSubmitting(false);
            } else {
                // Success - redirect to menu items list
                router.push("/admin/menu?tab=items");
            }
        } catch (error) {
            console.error("Error updating menu item:", error);
            setErrorMessage("An error occurred while updating the menu item. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setErrorMessage("");

        try {
            const result = await deleteMenuItem(id);

            if (result.error) {
                setErrorMessage(result.error);
                setIsDeleting(false);
            } else {
                // Success - redirect to menu items list
                router.push("/admin/menu?tab=items");
            }
        } catch (error) {
            console.error("Error deleting menu item:", error);
            setErrorMessage("An error occurred while deleting the menu item. Please try again.");
            setIsDeleting(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading menu item...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 px-4 mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <Link href="/admin/menu" className="mr-4">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Menu Item</h1>
                        <p className="text-gray-600 mt-1">
                            Update details for this menu item
                        </p>
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
                    Delete Item
                </Button>
            </div>

            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete this menu item? This action cannot be undone.
                        </p>
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
                    <CardTitle>Menu Item Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Basic Information */}
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Item Name *
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
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

                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                                        Price ($) *
                                    </label>
                                    <input
                                        id="price"
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        step="0.01"
                                        min="0"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Item Image
                                    </label>
                                    <div className="mt-1 flex flex-col space-y-4">
                                        {image ? (
                                            <div className="relative">
                                                <Image
                                                    src={image}
                                                    alt={name}
                                                    width={400}
                                                    height={400}
                                                    className="w-full h-48 object-cover rounded-md"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setImage("")}
                                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-md bg-gray-50">
                                                <div className="mb-2">
                                                    <ImageIcon className="h-10 w-10 text-gray-400" />
                                                </div>
                                                <UploadButton
                                                    endpoint="menuItemImage"
                                                    onBeforeUploadBegin={(files) => {
                                                        setIsUploading(true);
                                                        return files;
                                                    }}
                                                    onUploadProgress={() => {
                                                        // Handle upload progress if needed
                                                    }}
                                                    onClientUploadComplete={(res) => {
                                                        setIsUploading(false);
                                                        if (res && res[0]) {
                                                            setImage(res[0].url);
                                                        }
                                                    }}
                                                    onUploadError={(error) => {
                                                        setIsUploading(false);
                                                        setErrorMessage(`Error uploading image: ${error.message}`);
                                                    }}
                                                    className="ut-button:bg-orange-500 ut-button:hover:bg-orange-600"
                                                />
                                            </div>
                                        )}
                                        {isUploading && (
                                            <div className="flex items-center justify-center">
                                                <Loader2 className="h-5 w-5 animate-spin text-orange-500 mr-2" />
                                                <span className="text-sm text-gray-500">Uploading image...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="menu" className="block text-sm font-medium text-gray-700 mb-1">
                                        Menu *
                                    </label>
                                    <select
                                        id="menu"
                                        value={menuId}
                                        onChange={(e) => setMenuId(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    >
                                        <option value="">Select a menu</option>
                                        {menus.map((menu) => (
                                            <option key={menu.id} value={menu.id}>
                                                {menu.name} {menu.isActive ? "(Active)" : ""}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                                        Category *
                                    </label>
                                    <select
                                        id="category"
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className="w-full rounded-md border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                        required
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map((category) => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Additional Options & Dietary */}
                            <div className="space-y-4">
                                <div>
                                    <span className="block text-sm font-medium text-gray-700 mb-3">
                                        Item Status
                                    </span>
                                    <div className="flex items-center">
                                        <input
                                            id="isAvailable"
                                            type="checkbox"
                                            checked={isAvailable}
                                            onChange={(e) => setIsAvailable(e.target.checked)}
                                            className="rounded text-orange-500 focus:ring-orange-500 mr-2"
                                        />
                                        <label htmlFor="isAvailable" className="text-sm text-gray-600">
                                            Item is available for ordering
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <span className="block text-sm font-medium text-gray-700 mb-3">
                                        Dietary Preferences
                                    </span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center">
                                            <input
                                                id="isVegetarian"
                                                type="checkbox"
                                                checked={isVegetarian}
                                                onChange={(e) => setIsVegetarian(e.target.checked)}
                                                className="rounded text-green-500 focus:ring-green-500 mr-2"
                                            />
                                            <label htmlFor="isVegetarian" className="text-sm text-gray-600">
                                                Vegetarian
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="isVegan"
                                                type="checkbox"
                                                checked={isVegan}
                                                onChange={(e) => setIsVegan(e.target.checked)}
                                                className="rounded text-green-600 focus:ring-green-600 mr-2"
                                            />
                                            <label htmlFor="isVegan" className="text-sm text-gray-600">
                                                Vegan
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="isPescatarian"
                                                type="checkbox"
                                                checked={isPescatarian}
                                                onChange={(e) => setIsPescatarian(e.target.checked)}
                                                className="rounded text-blue-500 focus:ring-blue-500 mr-2"
                                            />
                                            <label htmlFor="isPescatarian" className="text-sm text-gray-600">
                                                Pescatarian
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="isGlutenFree"
                                                type="checkbox"
                                                checked={isGlutenFree}
                                                onChange={(e) => setIsGlutenFree(e.target.checked)}
                                                className="rounded text-yellow-500 focus:ring-yellow-500 mr-2"
                                            />
                                            <label htmlFor="isGlutenFree" className="text-sm text-gray-600">
                                                Gluten-Free
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="isDairyFree"
                                                type="checkbox"
                                                checked={isDairyFree}
                                                onChange={(e) => setIsDairyFree(e.target.checked)}
                                                className="rounded text-amber-500 focus:ring-amber-500 mr-2"
                                            />
                                            <label htmlFor="isDairyFree" className="text-sm text-gray-600">
                                                Dairy-Free
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="isNutFree"
                                                type="checkbox"
                                                checked={isNutFree}
                                                onChange={(e) => setIsNutFree(e.target.checked)}
                                                className="rounded text-brown-500 focus:ring-amber-700 mr-2"
                                            />
                                            <label htmlFor="isNutFree" className="text-sm text-gray-600">
                                                Nut-Free
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                id="isSpicy"
                                                type="checkbox"
                                                checked={isSpicy}
                                                onChange={(e) => setIsSpicy(e.target.checked)}
                                                className="rounded text-red-500 focus:ring-red-500 mr-2"
                                            />
                                            <label htmlFor="isSpicy" className="text-sm text-gray-600">
                                                Spicy
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Link href="/admin/menu">
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={isSubmitting || isUploading}
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