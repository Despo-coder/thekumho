"use client";

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import { Button } from "./button";
import { useEffect, useState } from "react";

export function CartButton() {
    const { cart, openCart } = useCart();
    const [mounted, setMounted] = useState(false);

    // Avoid hydration issues by only showing the cart after mounting
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={openCart}
            aria-label={`Open cart with ${cart.totalItems} items`}
        >
            <ShoppingCart className="h-5 w-5" />
            {cart.totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    {cart.totalItems}
                </span>
            )}
        </Button>
    );
} 