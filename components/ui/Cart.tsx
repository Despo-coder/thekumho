"use client";

import { useCart, CartItem } from "@/lib/cart/CartContext";
import { X, Plus, Minus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import { Button } from "./button";
import Link from "next/link";

export function Cart() {
    const { cart, isCartOpen, closeCart, updateQuantity, removeFromCart } = useCart();

    if (!isCartOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={closeCart}
                aria-hidden="true"
            ></div>

            {/* Cart Panel */}
            <div className="absolute inset-y-0 right-0 w-full max-w-md flex">
                <div className="relative w-full bg-white shadow-xl flex flex-col overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-lg font-medium">Your Cart</h2>
                        <button
                            onClick={closeCart}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-500"
                            aria-label="Close cart"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Cart content */}
                    <div className="flex-1 px-4 py-6">
                        {cart.items.length === 0 ? (
                            <div className="text-center py-16">
                                <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">Your cart is empty</h3>
                                <p className="text-gray-500 mb-6">Looks like you have not added any items yet.</p>
                                <Button
                                    onClick={closeCart}
                                    className="inline-flex items-center"
                                >
                                    Continue Shopping
                                </Button>
                            </div>
                        ) : (
                            <>
                                <ul className="divide-y divide-gray-200">
                                    {cart.items.map((item) => (
                                        <CartItemRow
                                            key={item.menuItemId}
                                            item={item}
                                            updateQuantity={updateQuantity}
                                            removeFromCart={removeFromCart}
                                        />
                                    ))}
                                </ul>

                                {/* Special Instructions (for all items) */}
                                <div className="mt-6">
                                    <label htmlFor="cart-notes" className="block text-sm font-medium text-gray-700 mb-1">
                                        Order Notes
                                    </label>
                                    <textarea
                                        id="cart-notes"
                                        rows={2}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        placeholder="Any special instructions for your order?"
                                    ></textarea>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Footer (subtotal and checkout) */}
                    {cart.items.length > 0 && (
                        <div className="border-t border-gray-200 px-4 py-6">
                            <div className="flex justify-between text-base font-medium text-gray-900 mb-4">
                                <p>Subtotal</p>
                                <p>${cart.subtotal.toFixed(2)}</p>
                            </div>
                            <p className="text-sm text-gray-500 mb-6">
                                Shipping and taxes calculated at checkout.
                            </p>
                            <Link href="/checkout" passHref>
                                <Button className="w-full justify-center py-6" onClick={closeCart}>
                                    Proceed to Checkout
                                </Button>
                            </Link>
                            <div className="mt-4">
                                <button
                                    onClick={closeCart}
                                    className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                                >
                                    Continue Shopping
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper component for cart items
function CartItemRow({
    item,
    updateQuantity,
    removeFromCart
}: {
    item: CartItem,
    updateQuantity: (id: string, quantity: number) => void,
    removeFromCart: (id: string) => void
}) {
    return (
        <li className="py-4 flex">
            {/* Item image */}
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 relative">
                {item.image ? (
                    <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover object-center"
                    />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                    </div>
                )}
            </div>

            {/* Item details */}
            <div className="ml-4 flex-1 flex flex-col">
                <div>
                    <div className="flex justify-between text-base font-medium text-gray-900">
                        <h3>{item.name}</h3>
                        <p className="ml-4">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                        {item.specialInstructions || "No special instructions"}
                    </p>
                </div>

                <div className="flex-1 flex items-end justify-between text-sm">
                    {/* Quantity controls */}
                    <div className="flex items-center border rounded">
                        <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                            className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                            aria-label="Decrease quantity"
                        >
                            <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-3 py-1 border-x">{item.quantity}</span>
                        <button
                            onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                            className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                            aria-label="Increase quantity"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </div>

                    {/* Remove button */}
                    <button
                        type="button"
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="text-sm font-medium text-red-600 hover:text-red-500"
                    >
                        Remove
                    </button>
                </div>
            </div>
        </li>
    );
} 