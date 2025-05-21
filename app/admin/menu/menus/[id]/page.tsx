"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { updateMenu, deleteMenu } from "@/lib/actions/menu-server-actions";
import React from "react";

interface EditMenuProps {
    params: Promise<{ id: string }>;
}

export default function EditMenu({ params }: EditMenuProps) {
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
    const [isActive, setIsActive] = useState(false);
    const [isPickup, setIsPickup] = useState(true);
    const [itemCount, setItemCount] = useState(0);

    useEffect(() => {
        // Check if user is authenticated and has appropriate role
        if (status === "unauthenticated") {
            router.push(`/login?callbackUrl=/admin/menu/menus/${id}`);
            return;
        }

        if (status === "authenticated") {
            if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
                router.push("/admin");
                return;
            }

            // Fetch the menu data
            const fetchData = async () => {
                try {
                    const response = await fetch(`/api/menu/menus/${id}`);
                    const data = await response.json();

                    if (!response.ok) {
                        setErrorMessage(data.error || "Failed to load menu data");
                        setIsLoading(false);
                        return;
                    }

                    setName(data.name);
                    setDescription(data.description || "");
                    setIsActive(data.isActive);
                    setIsPickup(data.isPickup);
                    setItemCount(data._count?.items || 0);
                    setIsLoading(false);
                } catch (error) {
                    console.error("Error fetching menu data:", error);
                    setErrorMessage("Failed to load menu data. Please try again.");
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
            if (!name) {
                setErrorMessage("Menu name is required.");
                setIsSubmitting(false);
                return;
            }

            // Update menu
            const result = await updateMenu(id, {
                name,
                description: description || null,
                isActive,
                isPickup,
            });

            if (result.error) {
                setErrorMessage(result.error);
                setIsSubmitting(false);
            } else {
                // Success - redirect to menu list
                router.push("/admin/menu?tab=menus");
            }
        } catch (error) {
            console.error("Error updating menu:", error);
            setErrorMessage("An error occurred while updating the menu. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setErrorMessage("");

        try {
            const result = await deleteMenu(id);

            if (result.error) {
                setErrorMessage(result.error);
                setIsDeleting(false);
            } else {
                // Success - redirect to menu list
                router.push("/admin/menu?tab=menus");
            }
        } catch (error) {
            console.error("Error deleting menu:", error);
            setErrorMessage("An error occurred while deleting the menu. Please try again.");
            setIsDeleting(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading menu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 px-4 mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <Link href="/admin/menu?tab=menus" className="mr-4">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Menu</h1>
                        <p className="text-gray-600 mt-1">
                            Update details for this menu
                        </p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={isDeleting || itemCount > 0}
                    title={itemCount > 0 ? "Cannot delete menu with items" : "Delete menu"}
                >
                    {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    Delete Menu
                </Button>
            </div>

            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete this menu? This action cannot be undone.
                            <br /><br />
                            <strong className="text-red-600">Note:</strong> You cannot delete a menu that has menu items assigned to it.
                        </p>
                        {errorMessage && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                                {errorMessage}
                            </div>
                        )}
                        <div className="flex justify-end space-x-3">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setDeleteConfirmOpen(false);
                                    setErrorMessage("");
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

            <Card>
                <CardHeader>
                    <CardTitle>Menu Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {errorMessage && !deleteConfirmOpen && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            {errorMessage}
                        </div>
                    )}

                    {itemCount > 0 && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md flex items-center justify-between">
                            <span>This menu contains <strong>{itemCount}</strong> item{itemCount !== 1 ? 's' : ''}.</span>
                            <Link href={`/admin/menu?tab=items`}>
                                <Button variant="outline" size="sm">
                                    View Items
                                </Button>
                            </Link>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Menu Name *
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

                            <div className="flex flex-col space-y-4 pt-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isActive" className="text-base">Active Menu</Label>
                                        <p className="text-sm text-gray-500">When active, this menu will be shown to customers.</p>
                                    </div>
                                    <Switch
                                        id="isActive"
                                        checked={isActive}
                                        onCheckedChange={setIsActive}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="isPickup" className="text-base">Available for Pickup</Label>
                                        <p className="text-sm text-gray-500">Allow customers to order from this menu for pickup.</p>
                                    </div>
                                    <Switch
                                        id="isPickup"
                                        checked={isPickup}
                                        onCheckedChange={setIsPickup}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Link href="/admin/menu?tab=menus">
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