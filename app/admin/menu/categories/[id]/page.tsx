"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, Loader2, Trash2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCategory, updateCategory, deleteCategory } from "@/lib/actions/menu-actions-reexport";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditCategoryProps {
    params: Promise<{ id: string }>;
}

export default function EditCategory({ params }: EditCategoryProps) {
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

    useEffect(() => {
        // Check if user is authenticated and has appropriate role
        if (status === "unauthenticated") {
            router.push(`/login?callbackUrl=/admin/menu/categories/${id}`);
            return;
        }

        if (status === "authenticated") {
            if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
                router.push("/admin");
                return;
            }

            // Fetch the category data
            const fetchData = async () => {
                try {
                    const categoryData = await getCategory(id);

                    if (categoryData.error) {
                        setErrorMessage(categoryData.error);
                        setIsLoading(false);
                        return;
                    }

                    if (categoryData.category) {
                        const category = categoryData.category;
                        setName(category.name);
                        setDescription(category.description || "");
                    }

                    setIsLoading(false);
                } catch (error) {
                    console.error("Error fetching category data:", error);
                    setErrorMessage("Failed to load category data. Please try again.");
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
                setErrorMessage("Category name is required.");
                setIsSubmitting(false);
                return;
            }

            // Update category
            const result = await updateCategory(id, {
                name,
                description: description || null,
            });

            if (result.error) {
                setErrorMessage(result.error);
                setIsSubmitting(false);
            } else {
                // Success - redirect to menu list
                router.push("/admin/menu?tab=categories");
            }
        } catch (error) {
            console.error("Error updating category:", error);
            setErrorMessage("An error occurred while updating the category. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setErrorMessage("");

        try {
            const result = await deleteCategory(id);

            if (result.error) {
                setErrorMessage(result.error);
                setIsDeleting(false);
            } else {
                // Success - redirect to menu categories list
                router.push("/admin/menu?tab=categories");
            }
        } catch (error) {
            console.error("Error deleting category:", error);
            setErrorMessage("An error occurred while deleting the category. Please try again.");
            setIsDeleting(false);
        }
    };

    if (status === "loading" || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-4 text-gray-600">Loading category...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-8 px-4 mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                    <Link href="/admin/menu?tab=categories" className="mr-4">
                        <Button variant="ghost" size="icon">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
                        <p className="text-gray-600 mt-1">
                            Update details for this category
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
                    Delete Category
                </Button>
            </div>

            {deleteConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete this category? This action cannot be undone.
                            <br /><br />
                            <strong className="text-red-600">Note:</strong> You cannot delete a category that has menu items assigned to it.
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

            <Tabs defaultValue="items" className="w-full">
                <TabsList className="mb-8">
                    <TabsTrigger value="items">Menu Items</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="menus">Menus</TabsTrigger>
                    <TabsTrigger value="promotions">Promotions</TabsTrigger>
                </TabsList>

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
                            {/* Promotions list table */}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Card>
                <CardHeader>
                    <CardTitle>Category Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {errorMessage && !deleteConfirmOpen && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                    Category Name *
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
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Link href="/admin/menu?tab=categories">
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