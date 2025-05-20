"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMenu } from "@/lib/actions/menu-server-actions";

export default function NewMenu() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    console.log(session);
    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isActive, setIsActive] = useState(false);
    const [isPickup, setIsPickup] = useState(true);

    // Check if user is authenticated and has appropriate role
    if (status === "unauthenticated") {
        router.push("/login?callbackUrl=/admin/menu/menus/new");
        return null;
    }

    if (status === "authenticated") {
        if (session.user.role !== "ADMIN" && session.user.role !== "MANAGER") {
            router.push("/admin");
            return null;
        }

        if (isLoading) {
            setIsLoading(false);
        }
    }

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

            // Create menu
            const result = await createMenu({
                name,
                description: description || undefined,
                isActive,
                isPickup,
            });

            if (result.error) {
                setErrorMessage(result.error);
                setIsSubmitting(false);
            } else {
                // Success - redirect to menus list
                router.push("/admin/menu?tab=menus");
            }
        } catch (error) {
            console.error("Error creating menu:", error);
            setErrorMessage("An error occurred while creating the menu. Please try again.");
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
                <Link href="/admin/menu?tab=menus" className="mr-4">
                    <Button variant="ghost" size="icon">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Add New Menu</h1>
                    <p className="text-gray-600 mt-1">
                        Create a new menu for your restaurant
                    </p>
                </div>
            </div>

            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Menu Details</CardTitle>
                </CardHeader>
                <CardContent>
                    {errorMessage && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            {errorMessage}
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

                            <div className="space-y-2">
                                <span className="block text-sm font-medium text-gray-700">
                                    Menu Options
                                </span>
                                <div className="flex items-center">
                                    <input
                                        id="isActive"
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="rounded text-orange-500 focus:ring-orange-500 mr-2"
                                    />
                                    <label htmlFor="isActive" className="text-sm text-gray-600">
                                        Set as active menu (will deactivate current active menu)
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="isPickup"
                                        type="checkbox"
                                        checked={isPickup}
                                        onChange={(e) => setIsPickup(e.target.checked)}
                                        className="rounded text-orange-500 focus:ring-orange-500 mr-2"
                                    />
                                    <label htmlFor="isPickup" className="text-sm text-gray-600">
                                        Available for pickup/takeout
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <Link href="/admin/menu?tab=menus">
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Menu"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
} 