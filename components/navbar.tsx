'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import {
    User,
    LogOut,
    Menu as MenuIcon,
    X,
    ShoppingCart,
    CalendarDays,
    UtensilsCrossed
} from "lucide-react"

export function Navbar() {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = useState(false)

    // Define main navigation links
    const navLinks = [
        { name: "Home", href: "/" },
        { name: "Menu", href: "/menu" },
        { name: "Reservation", href: "/reservation" },
    ]

    // Check if a link is active
    const isLinkActive = (path: string) => {
        if (path === "/" && pathname === "/") return true
        if (path !== "/" && pathname.startsWith(path)) return true
        return false
    }

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
            <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <h6 className="text-2xl font-kaiseiOpti font-semibold text-orange-500">THE KUMO</h6>
                </Link>

                {/* Hamburger for mobile */}
                <button
                    className="md:hidden flex items-center p-2"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    {menuOpen ?
                        <X className="w-6 h-6" /> :
                        <MenuIcon className="w-6 h-6" />
                    }
                </button>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium transition-colors ${isLinkActive(link.href)
                                ? "text-orange-500"
                                : "text-gray-700 hover:text-orange-500"
                                }`}
                        >
                            {link.name}
                        </Link>
                    ))}

                    {/* Auth buttons based on session state */}
                    {status === "loading" ? (
                        <div className="h-10 w-20 bg-gray-100 animate-pulse rounded"></div>
                    ) : session ? (
                        <div className="flex items-center gap-4">
                            {session.user.role === "ADMIN" && (
                                <Link
                                    href="/admin"
                                    className="text-sm font-medium text-gray-700 hover:text-orange-500"
                                >
                                    Dashboard
                                </Link>
                            )}
                            <Link
                                href="/orders"
                                className="text-sm font-medium text-gray-700 hover:text-orange-500 flex items-center gap-1"
                            >
                                <ShoppingCart className="w-4 h-4" />
                                <span>Orders</span>
                            </Link>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2"
                                onClick={() => signOut({ callbackUrl: "/" })}
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Logout</span>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">
                                    Sign in
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button className="bg-orange-500 hover:bg-orange-600" size="sm">
                                    Sign up
                                </Button>
                            </Link>
                        </div>
                    )}
                </nav>
            </div>

            {/* Mobile nav */}
            {menuOpen && (
                <nav className="md:hidden bg-white border-t px-4 py-3 flex flex-col gap-3">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`flex items-center gap-2 text-sm font-medium py-2 ${isLinkActive(link.href)
                                ? "text-orange-500"
                                : "text-gray-700"
                                }`}
                            onClick={() => setMenuOpen(false)}
                        >
                            {link.href === "/" && <UtensilsCrossed className="w-4 h-4" />}
                            {link.href === "/menu" && <MenuIcon className="w-4 h-4" />}
                            {link.href === "/reservation" && <CalendarDays className="w-4 h-4" />}
                            {link.name}
                        </Link>
                    ))}

                    <div className="h-px w-full bg-gray-100 my-1"></div>

                    {status === "loading" ? (
                        <div className="h-10 w-full bg-gray-100 animate-pulse rounded"></div>
                    ) : session ? (
                        <>
                            <div className="flex items-center gap-2 py-2 text-sm">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="font-medium">{session.user.name || session.user.email}</span>
                            </div>

                            {session.user.role === "ADMIN" && (
                                <Link
                                    href="/admin"
                                    className="flex items-center gap-2 text-sm font-medium py-2 text-gray-700"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                            )}

                            <Link
                                href="/orders"
                                className="flex items-center gap-2 text-sm font-medium py-2 text-gray-700"
                                onClick={() => setMenuOpen(false)}
                            >
                                <ShoppingCart className="w-4 h-4" />
                                My Orders
                            </Link>

                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-2 mt-1"
                                onClick={() => {
                                    setMenuOpen(false)
                                    signOut({ callbackUrl: "/" })
                                }}
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </Button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-2 pt-2">
                            <Link href="/login" onClick={() => setMenuOpen(false)}>
                                <Button variant="outline" className="w-full">
                                    Sign in
                                </Button>
                            </Link>
                            <Link href="/register" onClick={() => setMenuOpen(false)}>
                                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                                    Sign up
                                </Button>
                            </Link>
                        </div>
                    )}
                </nav>
            )}
        </header>
    )
} 