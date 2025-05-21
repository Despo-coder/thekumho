"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart/CartContext";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Minus, Plus, Trash, ShoppingBag } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
    const { cart, removeFromCart, updateQuantity } = useCart();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Handle quantity changes
    const handleQuantityChange = (menuItemId: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        updateQuantity(menuItemId, newQuantity);
    };

    if (!mounted) {
        return <div className="container mx-auto py-12 px-4">Loading...</div>;
    }

    // If cart is empty, show empty cart message
    if (cart.items.length === 0) {
        return (
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center py-16">
                    <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
                    <p className="text-gray-600 mb-6">Add some delicious items to your cart.</p>
                    <Link href="/menu" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Browse Menu
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <ul className="divide-y divide-gray-200">
                            {cart.items.map((item) => (
                                <li key={item.menuItemId} className="p-6 flex flex-col sm:flex-row gap-4">
                                    {/* Item Image */}
                                    <div className="w-full sm:w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                        {item.image ? (
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                width={96}
                                                height={96}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                No image
                                            </div>
                                        )}
                                    </div>

                                    {/* Item Details */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {formatCurrency(item.price)} each
                                                </p>
                                                {item.specialInstructions && (
                                                    <p className="mt-1 text-sm text-gray-500 italic">
                                                        &quot;{item.specialInstructions}&quot;
                                                    </p>
                                                )}
                                            </div>
                                            <p className="text-lg font-medium text-gray-900">
                                                {formatCurrency(Number(item.price) * item.quantity)}
                                            </p>
                                        </div>

                                        {/* Quantity Control and Remove Button */}
                                        <div className="mt-4 flex justify-between items-center">
                                            <div className="flex border rounded-md">
                                                <button
                                                    type="button"
                                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                                    onClick={() => handleQuantityChange(item.menuItemId, item.quantity - 1)}
                                                >
                                                    <Minus className="h-4 w-4" />
                                                </button>
                                                <span className="px-4 py-1 border-l border-r flex items-center">
                                                    {item.quantity}
                                                </span>
                                                <button
                                                    type="button"
                                                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                                                    onClick={() => handleQuantityChange(item.menuItemId, item.quantity + 1)}
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => removeFromCart(item.menuItemId)}
                                                className="text-red-600 hover:text-red-800 flex items-center"
                                            >
                                                <Trash className="h-4 w-4 mr-1" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mt-6">
                        <Link
                            href="/menu"
                            className="inline-flex items-center text-gray-600 hover:text-orange-600"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Continue Shopping
                        </Link>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="md:col-span-1">
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 sticky top-24">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>

                        <div className="space-y-3">
                            <div className="flex justify-between text-base">
                                <p>Subtotal ({cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'})</p>
                                <p>{formatCurrency(cart.subtotal)}</p>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <p>Taxes (estimated)</p>
                                <p>{formatCurrency(cart.subtotal * 0.075)}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 mt-4 pt-4">
                            <div className="flex justify-between text-base font-medium text-gray-900">
                                <p>Total</p>
                                <p>{formatCurrency(cart.subtotal + cart.subtotal * 0.075)}</p>
                            </div>
                            <p className="mt-0.5 text-sm text-gray-500">Shipping and delivery fees calculated at checkout</p>
                        </div>

                        <div className="mt-6">
                            <Link
                                href="/checkout"
                                className="block w-full bg-orange-600 px-4 py-3 text-center font-medium text-white rounded-md hover:bg-orange-700"
                            >
                                Proceed to Checkout
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 