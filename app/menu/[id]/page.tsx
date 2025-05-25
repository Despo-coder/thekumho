"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, Minus, Plus, ShoppingCart, Star } from "lucide-react";
// import { useRouter } from "next/navigation";
import React from "react";
import { useCart } from "@/lib/cart/CartContext";
import MenuItemReviews from "@/components/MenuItemReviews";

// Types for our data
type Review = {
    id: string;
    rating: number;
    title: string | null;
    content: string | null;
    createdAt: string;
    user: {
        name: string;
    } | null;
};

type MenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image: string | null;
    isAvailable: boolean;
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
    isNutFree: boolean;
    isPescatarian: boolean;
    isSpicy: boolean;
    category: {
        id: string;
        name: string;
    };
    menu: {
        id: string;
        name: string;
    };
    reviews: Review[];
};

export default function MenuItemDetail({ params }: { params: Promise<{ id: string }> }) {
    //const router = useRouter();
    // Unwrap the params promise
    const resolvedParams = React.use(params);
    const id = resolvedParams.id;

    const { addToCart: addToCartContext } = useCart();
    const [menuItem, setMenuItem] = useState<MenuItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [addedToCart, setAddedToCart] = useState(false);

    // Fetch menu item details
    useEffect(() => {
        const fetchMenuItem = async () => {
            try {
                // Use the resolved id instead of accessing params.id directly
                const response = await fetch(`/api/menu/${id}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch menu item");
                }
                const data = await response.json();
                setMenuItem(data);
            } catch (error) {
                console.error("Error fetching menu item:", error);
                setError("Unable to load menu item details. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchMenuItem();
    }, [id]); // Use id from resolved params

    // Calculate average rating
    const getAverageRating = (reviews: Review[]) => {
        if (!reviews || reviews.length === 0) return 0;
        const sum = reviews.reduce((total, review) => total + review.rating, 0);
        return parseFloat((sum / reviews.length).toFixed(1));
    };

    // Handle quantity changes
    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(quantity - 1);
        }
    };

    const increaseQuantity = () => {
        setQuantity(quantity + 1);
    };

    // Add to cart functionality
    const handleAddToCart = async () => {
        if (!menuItem) return;

        setIsAddingToCart(true);

        try {
            const cartItem = {
                menuItemId: menuItem.id,
                name: menuItem.name,
                price: menuItem.price,
                quantity: quantity,
                specialInstructions: specialInstructions,
                image: menuItem.image,
            };

            // Use the CartContext to add the item rather than manually updating localStorage
            addToCartContext(cartItem);

            // Show success message
            setAddedToCart(true);

            // Reset form after a delay
            setTimeout(() => {
                setAddedToCart(false);
            }, 3000);
        } catch (error) {
            console.error("Error adding item to cart:", error);
            setError("Failed to add item to cart. Please try again.");
        } finally {
            setIsAddingToCart(false);
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded-md w-1/3 mx-auto mb-4"></div>
                        <div className="h-64 bg-gray-200 rounded-md mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-full mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded-md w-5/6 mx-auto"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !menuItem) {
        return (
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4">Error</h2>
                    <p className="text-gray-600 mb-6">{error || "Menu item not found"}</p>
                    <Link
                        href="/menu"
                        className="inline-flex items-center text-orange-600 hover:text-orange-700"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Menu
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
            {/* Back button */}
            <div className="mb-6">
                <Link
                    href="/menu"
                    className="inline-flex items-center text-gray-600 hover:text-orange-600"
                >
                    <ChevronLeft className="h-5 w-5 mr-1" />
                    Back to Menu
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Image Section */}
                <div className="relative h-[300px] md:h-[400px] bg-gray-100 rounded-lg overflow-hidden">
                    {menuItem.image ? (
                        <Image
                            src={menuItem.image}
                            alt={menuItem.name}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                            No image available
                        </div>
                    )}
                </div>

                {/* Details Section */}
                <div>
                    <h1 className="text-3xl font-bold mb-2">{menuItem.name}</h1>

                    <div className="flex items-center mb-4">
                        <span className="text-xl font-bold text-orange-600 mr-4">
                            ${Number(menuItem.price).toFixed(2)}
                        </span>

                        <div className="flex items-center">
                            <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={`h-4 w-4 ${star <= getAverageRating(menuItem.reviews)
                                            ? "text-yellow-500 fill-yellow-500"
                                            : "text-gray-300"
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-600 ml-2">
                                ({menuItem.reviews.length} {menuItem.reviews.length === 1 ? "review" : "reviews"})
                            </span>
                        </div>
                    </div>

                    <p className="text-gray-700 mb-6">{menuItem.description || "No description available."}</p>

                    {/* Dietary Tags */}
                    <div className="flex flex-wrap mb-6">
                        {menuItem.isVegetarian && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
                                Vegetarian
                            </span>
                        )}
                        {menuItem.isVegan && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
                                Vegan
                            </span>
                        )}
                        {menuItem.isGlutenFree && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
                                Gluten Free
                            </span>
                        )}
                        {menuItem.isDairyFree && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
                                Dairy Free
                            </span>
                        )}
                        {menuItem.isNutFree && (
                            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
                                Nut Free
                            </span>
                        )}
                        {menuItem.isPescatarian && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
                                Pescatarian
                            </span>
                        )}
                        {menuItem.isSpicy && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-2 mb-2">
                                Spicy
                            </span>
                        )}
                    </div>

                    {/* Category */}
                    <div className="mb-6">
                        <p className="text-sm text-gray-600">
                            Category: <span className="font-medium">{menuItem.category.name}</span>
                        </p>
                    </div>

                    {/* Order Form */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-bold mb-4">Add to Order</h3>

                        {/* Quantity Selector */}
                        <div className="flex items-center mb-4">
                            <span className="mr-3">Quantity:</span>
                            <div className="flex items-center border rounded-md">
                                <button
                                    onClick={decreaseQuantity}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="px-4 py-1 border-l border-r">{quantity}</span>
                                <button
                                    onClick={increaseQuantity}
                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Special Instructions */}
                        <div className="mb-4">
                            <label htmlFor="special-instructions" className="block mb-2 text-sm font-medium">
                                Special Instructions
                            </label>
                            <textarea
                                id="special-instructions"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                                rows={3}
                                placeholder="Any special requests or allergies?"
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                            ></textarea>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="flex items-center">
                            <button
                                onClick={handleAddToCart}
                                disabled={isAddingToCart || !menuItem?.isAvailable}
                                className={`flex items-center justify-center w-full py-3 px-4 rounded-md text-white font-medium ${menuItem?.isAvailable
                                    ? "bg-orange-600 hover:bg-orange-700"
                                    : "bg-gray-400 cursor-not-allowed"
                                    }`}
                            >
                                {isAddingToCart ? (
                                    <span className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Adding...
                                    </span>
                                ) : (
                                    <>
                                        <ShoppingCart className="h-5 w-5 mr-2" />
                                        {menuItem?.isAvailable ? "Add to Cart" : "Currently Unavailable"}
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Success Message */}
                        {addedToCart && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md flex items-center">
                                ✓ Added to cart successfully!
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
                                {error}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-16">
                <MenuItemReviews
                    menuItemId={menuItem.id}
                    menuItemName={menuItem.name}
                />
            </div>
        </div>
    );
} 