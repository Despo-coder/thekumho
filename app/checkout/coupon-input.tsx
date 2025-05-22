'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Define interfaces for the component props and promotion data
interface CartItem {
    menuItemId: string;
    quantity: number;
    price: number;
    name?: string;
    specialInstructions?: string;
}

interface Promotion {
    id: string;
    name: string;
    description?: string | null;
    type: string;
    couponCode?: string | null;
}

interface CouponInputProps {
    onApply: (promotion: Promotion, discount: number) => void;
    cartItems: CartItem[];
    cartTotal: number;
    disabled?: boolean;
}

export function CouponInput({ onApply, cartItems, cartTotal, disabled = false }: CouponInputProps) {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const applyCoupon = async () => {
        if (!code.trim()) return;

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/promotions/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    cartItems,
                    cartTotal
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to apply coupon');
                return;
            }

            onApply(data.promotion, data.discount);
            toast(data.message, {
                description: `Discount: $${data.discount.toFixed(2)}`,
                action: {
                    label: "View Details",
                    onClick: () => console.log("Promotion details:", data.promotion)
                }
            });

            // Clear the input after successful application
            setCode('');
        } catch (err) {
            setError('An error occurred while validating the coupon' + err);
            toast("Failed to validate coupon code", {
                description: "Please try again or contact support",
                action: {
                    label: "Dismiss",
                    onClick: () => console.log("Dismissed")
                }
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-2 my-4">
            <div className="flex items-center gap-2">
                <Input
                    placeholder="Enter coupon code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    disabled={disabled || loading}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            applyCoupon();
                        }
                    }}
                    className="flex-1"
                />
                <Button
                    onClick={applyCoupon}
                    disabled={!code.trim() || loading || disabled}
                    className="whitespace-nowrap"
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Apply Coupon
                </Button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}