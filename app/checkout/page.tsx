"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ShoppingBag, AlertCircle, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { StripePaymentWrapper } from "@/components/checkout/StripePaymentForm";

export default function CheckoutPage() {
    const { cart, removeFromCart, clearCart } = useCart();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [mounted, setMounted] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({
        name: "",
        email: "",
        phone: "",
        address: "",
    });
    const [orderNotes, setOrderNotes] = useState("");
    const [pickupTime, setPickupTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
    const [clientSecret, setClientSecret] = useState("");
    const [paymentError, setPaymentError] = useState("");
    const [orderCreated, setOrderCreated] = useState(false);

    // Avoid hydration issues by only rendering cart content after mounting
    useEffect(() => {
        setMounted(true);

        // Pre-fill customer info from session data if available
        if (session?.user) {
            setCustomerInfo(prev => ({
                ...prev,
                name: session.user.name || prev.name,
                email: session.user.email || prev.email,
            }));
        }
    }, [session]);

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCustomerInfo(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Create payment intent when paying with card
    const createPaymentIntent = async () => {
        if (cart.subtotal <= 0) return;

        setIsSubmitting(true);
        setPaymentError(""); // Clear any previous errors

        try {
            console.log("Creating payment intent for amount:", cart.subtotal + cart.subtotal * 0.075);

            const totalAmount = cart.subtotal + cart.subtotal * 0.075;
            console.log("Cart items:", cart.items);

            const response = await fetch("/api/payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: totalAmount,
                    metadata: {
                        orderType: "PICKUP",
                        pickupTime,
                        items: JSON.stringify(cart.items.map(item => ({
                            menuItemId: item.menuItemId,
                            quantity: item.quantity,
                        }))),
                    }
                }),
            });

            let data;
            try {
                data = await response.json();
            } catch (parseError) {
                console.error("Error parsing response:", parseError);
                throw new Error("Could not parse server response");
            }

            console.log("Payment API response status:", response.status);

            if (!response.ok) {
                console.error("Payment intent creation failed:", data);
                throw new Error(
                    data.message ||
                    data.error ||
                    `Server error (${response.status}): Failed to create payment intent`
                );
            }

            if (!data.clientSecret) {
                console.error("No client secret in response:", data);
                throw new Error("Invalid server response: No client secret returned");
            }

            console.log("Payment intent created successfully");
            setClientSecret(data.clientSecret);
            setOrderCreated(true);
            setIsSubmitting(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Payment processing error";
            console.error("Error creating payment intent:", errorMessage);
            setPaymentError(errorMessage);
            setIsSubmitting(false);
        }
    };

    // Handle Stripe payment success
    const handlePaymentSuccess = () => {
        // This will mostly be handled by the redirect to confirmation page
        console.log("Payment successful");
    };

    // Handle Stripe payment error
    const handlePaymentError = (error: string) => {
        setPaymentError(error);
        setIsSubmitting(false);
    };

    // Submit order
    const handleSubmitOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        if (cart.items.length === 0) {
            return;
        }

        // Redirect to login if not authenticated
        if (!session) {
            // Save the current URL to redirect back after login
            localStorage.setItem('checkoutRedirect', 'true');
            router.push('/login');
            return;
        }

        setIsSubmitting(true);

        try {
            if (paymentMethod === "card") {
                // Create payment intent for Stripe
                await createPaymentIntent();
            } else {
                // Cash payment - proceed directly
                // In a real implementation, you would submit the order to your backend API
                // For now, we'll just simulate a successful order

                // Example of an order payload
                const orderData = {
                    userId: session.user.id,
                    customer: customerInfo,
                    items: cart.items.map(item => ({
                        menuItemId: item.menuItemId,
                        quantity: item.quantity,
                        specialInstructions: item.specialInstructions || null,
                        price: item.price
                    })),
                    subtotal: cart.subtotal,
                    orderNotes,
                    pickupTime,
                    orderType: "PICKUP",
                    paymentMethod: "CASH"
                };

                console.log("Order submitted:", orderData);

                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Redirect to confirmation page
                clearCart();
                router.push("/checkout/confirmation");
            }
        } catch (error) {
            console.error("Error submitting order:", error);
            setIsSubmitting(false);
        }
    };

    if (!mounted) {
        return <div className="container mx-auto py-12 px-4">Loading...</div>;
    }

    // If cart is empty, redirect to menu
    if (cart.items.length === 0) {
        return (
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="text-center py-16">
                    <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
                    <p className="text-gray-600 mb-6">Add some delicious items to your cart before checkout.</p>
                    <Link href="/menu" className="inline-flex items-center text-orange-600 hover:text-orange-700 font-medium">
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Browse Menu
                    </Link>
                </div>
            </div>
        );
    }

    // If payment intent is created and payment method is card, show Stripe form
    if (orderCreated && paymentMethod === "card" && clientSecret) {
        return (
            <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold mb-6">Complete Payment</h1>

                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                        <div className="flex justify-between mb-2">
                            <span>Subtotal ({cart.totalItems} {cart.totalItems === 1 ? 'item' : 'items'})</span>
                            <span>{formatCurrency(cart.subtotal)}</span>
                        </div>
                        <div className="flex justify-between mb-4">
                            <span>Tax (7.5%)</span>
                            <span>{formatCurrency(cart.subtotal * 0.075)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg border-t pt-4">
                            <span>Total</span>
                            <span>{formatCurrency(cart.subtotal + cart.subtotal * 0.075)}</span>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                            <CreditCard className="mr-2 h-5 w-5 text-gray-500" />
                            Payment Details
                        </h2>

                        {paymentError && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                                {paymentError}
                            </div>
                        )}

                        <StripePaymentWrapper
                            clientSecret={clientSecret}
                            onPaymentSuccess={handlePaymentSuccess}
                            onPaymentError={handlePaymentError}
                            total={cart.subtotal + cart.subtotal * 0.075}
                        />
                    </div>

                    <div className="mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setOrderCreated(false)}
                            className="w-full"
                        >
                            Back to Order Details
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold mb-6">Checkout</h1>

            {/* Authentication notice */}
            {!session && status !== "loading" && (
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-6 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-amber-800">Authentication Required</h3>
                        <p className="text-amber-700 mt-1">
                            You need to be signed in to place an order. Your cart items will be preserved.
                        </p>
                        <div className="mt-3 flex gap-2">
                            <Link href="/login">
                                <Button variant="outline" size="sm">
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-orange-500 hover:bg-orange-600" size="sm">
                                    Create Account
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Summary - Right column on large screens */}
                <div className="lg:col-span-1 order-1 lg:order-2">
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 sticky top-24">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

                        <div className="space-y-4 mb-6">
                            {cart.items.map(item => (
                                <div key={item.menuItemId} className="flex border-b pb-4">
                                    <div className="w-16 h-16 relative flex-shrink-0 rounded overflow-hidden">
                                        {item.image ? (
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                                <span className="text-gray-400 text-xs">No image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-4 flex-1">
                                        <div className="flex justify-between">
                                            <h4 className="font-medium">{item.name}</h4>
                                            <p className="text-gray-700">{formatCurrency(Number(item.price) * item.quantity)}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="text-gray-600 text-sm">
                                                {formatCurrency(Number(item.price))} x {item.quantity}
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.menuItemId)}
                                                className="text-sm text-red-600 hover:text-red-800"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{formatCurrency(cart.subtotal)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tax (7.5%)</span>
                                <span>{formatCurrency(cart.subtotal * 0.075)}</span>
                            </div>
                        </div>

                        <div className="border-t mt-4 pt-4">
                            <div className="flex justify-between font-bold">
                                <span>Total</span>
                                <span>{formatCurrency(cart.subtotal + cart.subtotal * 0.075)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer Information Form - Left column on large screens */}
                <div className="lg:col-span-2 order-2 lg:order-1">
                    <form onSubmit={handleSubmitOrder}>
                        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                                        Full Name*
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={customerInfo.name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address*
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={customerInfo.email}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number*
                                    </label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={customerInfo.phone}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-1">
                                        Pickup Time*
                                    </label>
                                    <select
                                        id="pickupTime"
                                        value={pickupTime}
                                        onChange={(e) => setPickupTime(e.target.value)}
                                        required
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    >
                                        <option value="">Select a time</option>
                                        {/* Generate pickup times (30 min intervals) */}
                                        {Array.from({ length: 12 }).map((_, i) => {
                                            const now = new Date();
                                            // Start 30 minutes from now, round to nearest 30 min
                                            const start = new Date(
                                                now.getTime() + 30 * 60000 - (now.getMinutes() % 30) * 60000
                                            );
                                            const time = new Date(start.getTime() + i * 30 * 60000);
                                            const timeStr = time.toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            });
                                            return (
                                                <option key={i} value={timeStr}>
                                                    {timeStr}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="orderNotes" className="block text-sm font-medium text-gray-700 mb-1">
                                    Order Notes (Optional)
                                </label>
                                <textarea
                                    id="orderNotes"
                                    value={orderNotes}
                                    onChange={(e) => setOrderNotes(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Any special instructions for your order..."
                                ></textarea>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6">
                            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                            <div className="space-y-3">
                                <div className="flex items-center">
                                    <input
                                        id="payment-cash"
                                        name="payment-method"
                                        type="radio"
                                        checked={paymentMethod === "cash"}
                                        onChange={() => setPaymentMethod("cash")}
                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                                    />
                                    <label htmlFor="payment-cash" className="ml-3 block text-gray-700">
                                        Pay at Pickup (Cash)
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        id="payment-card"
                                        name="payment-method"
                                        type="radio"
                                        checked={paymentMethod === "card"}
                                        onChange={() => setPaymentMethod("card")}
                                        className="h-4 w-4 text-orange-600 focus:ring-orange-500"
                                    />
                                    <label htmlFor="payment-card" className="ml-3 block text-gray-700">
                                        Credit/Debit Card (Pay Online)
                                    </label>
                                </div>
                            </div>

                            {paymentMethod === "card" && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
                                    <div className="flex items-center text-sm text-gray-600">
                                        <p>
                                            You&apos;ll be redirected to our secure payment processor to complete your payment.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center">
                            <Link href="/menu" className="inline-flex items-center text-gray-600 hover:text-orange-600">
                                <ChevronLeft className="mr-2 h-4 w-4" />
                                Continue Shopping
                            </Link>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`bg-orange-600 hover:bg-orange-700 text-white py-3 px-6 rounded-md font-medium ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                                    }`}
                            >
                                {isSubmitting ? "Processing..." : paymentMethod === "card" ? "Continue to Payment" : "Place Order"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
} 