"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

// Types for cart items
export type CartItem = {
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    specialInstructions?: string;
    image?: string | null;
};

// Cart state interface
interface CartState {
    items: CartItem[];
    subtotal: number;
    totalItems: number;
}

// Cart context interface
interface CartContextType {
    cart: CartState;
    addToCart: (item: CartItem) => void;
    removeFromCart: (menuItemId: string) => void;
    updateQuantity: (menuItemId: string, quantity: number) => void;
    clearCart: () => void;
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
}

// Initial cart state
const initialCartState: CartState = {
    items: [],
    subtotal: 0,
    totalItems: 0,
};

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Custom hook to use cart context
export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

// Cart provider component
export function CartProvider({ children }: { children: React.ReactNode }) {
    const [cart, setCart] = useState<CartState>(initialCartState);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart from localStorage on initial render (client-side only)
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                // Calculate subtotal and totalItems
                const subtotal = parsedCart.items.reduce(
                    (total: number, item: CartItem) => total + item.price * item.quantity,
                    0
                );
                const totalItems = parsedCart.items.reduce(
                    (total: number, item: CartItem) => total + item.quantity,
                    0
                );

                setCart({
                    items: parsedCart.items,
                    subtotal,
                    totalItems,
                });
            } catch (error) {
                console.error("Error parsing cart from localStorage:", error);
                localStorage.removeItem("cart");
            }
        }
        setIsInitialized(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isInitialized) {
            localStorage.setItem("cart", JSON.stringify({ items: cart.items }));
        }
    }, [cart, isInitialized]);

    // Add item to cart
    const addToCart = (item: CartItem) => {
        setCart((prevCart) => {
            // Check if item already exists in cart
            const existingItemIndex = prevCart.items.findIndex(
                (cartItem) => cartItem.menuItemId === item.menuItemId
            );

            let newItems;

            if (existingItemIndex >= 0) {
                // Update existing item
                newItems = [...prevCart.items];
                newItems[existingItemIndex] = {
                    ...newItems[existingItemIndex],
                    quantity: newItems[existingItemIndex].quantity + item.quantity,
                    specialInstructions: item.specialInstructions || newItems[existingItemIndex].specialInstructions,
                };
            } else {
                // Add new item
                newItems = [...prevCart.items, item];
            }

            // Calculate new subtotal and totalItems
            const subtotal = newItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            );
            const totalItems = newItems.reduce(
                (total, item) => total + item.quantity,
                0
            );

            return {
                items: newItems,
                subtotal,
                totalItems,
            };
        });

        // Open cart when adding items
        setIsCartOpen(true);
    };

    // Remove item from cart
    const removeFromCart = (menuItemId: string) => {
        setCart((prevCart) => {
            const newItems = prevCart.items.filter(
                (item) => item.menuItemId !== menuItemId
            );

            // Calculate new subtotal and totalItems
            const subtotal = newItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            );
            const totalItems = newItems.reduce(
                (total, item) => total + item.quantity,
                0
            );

            return {
                items: newItems,
                subtotal,
                totalItems,
            };
        });
    };

    // Update item quantity
    const updateQuantity = (menuItemId: string, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(menuItemId);
            return;
        }

        setCart((prevCart) => {
            const newItems = prevCart.items.map((item) =>
                item.menuItemId === menuItemId ? { ...item, quantity } : item
            );

            // Calculate new subtotal and totalItems
            const subtotal = newItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0
            );
            const totalItems = newItems.reduce(
                (total, item) => total + item.quantity,
                0
            );

            return {
                items: newItems,
                subtotal,
                totalItems,
            };
        });
    };

    // Clear cart
    const clearCart = () => {
        setCart(initialCartState);
    };

    // Open cart
    const openCart = () => {
        setIsCartOpen(true);
    };

    // Close cart
    const closeCart = () => {
        setIsCartOpen(false);
    };

    return (
        <CartContext.Provider
            value={{
                cart,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                isCartOpen,
                openCart,
                closeCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
} 