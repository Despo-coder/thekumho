"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isRedirectingFromCheckout, setIsRedirectingFromCheckout] = useState(false);

    // Check if user is being redirected from checkout
    useEffect(() => {
        const checkoutRedirect = localStorage.getItem('checkoutRedirect');
        if (checkoutRedirect === 'true') {
            setIsRedirectingFromCheckout(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError("Invalid email or password");
                setIsLoading(false);
                return;
            }

            // Clear the checkout redirect flag and redirect to checkout if needed
            if (isRedirectingFromCheckout) {
                localStorage.removeItem('checkoutRedirect');
                router.push("/checkout");
            } else {
                router.push("/");
            }

            router.refresh();
        } catch (error) {
            setError("An error occurred during login" + error);
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Or{" "}
                        <Link
                            href="/register"
                            className="font-medium text-orange-600 hover:text-orange-500"
                        >
                            create a new account
                        </Link>
                    </p>

                    {isRedirectingFromCheckout && (
                        <div className="mt-4 rounded-md bg-orange-50 p-3 text-sm text-orange-700 border border-orange-200">
                            Please sign in to complete your order. Your cart items will be preserved.
                        </div>
                    )}
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4">
                        <div className="flex">
                            <div className="text-sm font-medium text-red-800">{error}</div>
                        </div>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full appearance-none rounded-none rounded-t-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full appearance-none rounded-none rounded-b-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-500 focus:z-10 focus:border-orange-500 focus:outline-none focus:ring-orange-500 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-orange-600 py-2 px-4 text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 