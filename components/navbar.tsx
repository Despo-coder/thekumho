'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useState, useEffect, useRef } from "react"
import { signOut, useSession } from "next-auth/react"
import { useCart } from "@/lib/cart/CartContext"
import {
    User,
    LogOut,
    Menu as MenuIcon,
    X,
    ShoppingCart,
    CalendarDays,
    UtensilsCrossed,
    Settings,
    Clock
} from "lucide-react"

export function Navbar() {
    const { data: session, status } = useSession()
    const pathname = usePathname()
    const router = useRouter()
    const [menuOpen, setMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const { cart } = useCart()
    const [mounted, setMounted] = useState(false)
    const userMenuRef = useRef<HTMLDivElement>(null)

    // Use client-side rendering to prevent hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    // Handle click outside user menu to close it
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setUserMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

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

    // Handle avatar click
    const handleAvatarClick = () => {
        if (!session) {
            router.push('/login')
        } else {
            setUserMenuOpen(!userMenuOpen)
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b shadow-sm">
            <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">
                    <svg className="size-8 text-[#e96629]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                        <path d="M42.4379 44C42.4379 44 36.0744 33.9038 41.1692 24C46.8624 12.9336 42.2078 4 42.2078 4L7.01134 4C7.01134 4 11.6577 12.932 5.96912 23.9969C0.876273 33.9029 7.27094 44 7.27094 44L42.4379 44Z" fill="currentColor"></path>
                    </svg>
                    <h6 className="text-2xl font-kaiseiOpti font-semibold text-orange-500">THE KUMO</h6>
                </Link>

                {/* Mobile controls: Cart + Hamburger */}
                <div className="md:hidden flex items-center gap-3">
                    {/* Cart icon for mobile */}
                    {mounted && (
                        <Link href="/cart" className="relative p-2">
                            <ShoppingCart className="w-5 h-5 text-gray-700 hover:text-orange-500" />
                            {cart.totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                    {cart.totalItems}
                                </span>
                            )}
                        </Link>
                    )}

                    {/* Hamburger menu button */}
                    <button
                        className="flex items-center p-2"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Toggle menu"
                    >
                        {menuOpen ?
                            <X className="w-6 h-6" /> :
                            <MenuIcon className="w-6 h-6" />
                        }
                    </button>
                </div>

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

                    <div className="flex items-center gap-3">
                        {/* Cart icon with item count */}
                        {mounted && (
                            <Link href="/cart" className="relative p-2">
                                <ShoppingCart className="w-5 h-5 text-gray-700 hover:text-orange-500" />
                                {cart.totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {cart.totalItems}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* User avatar */}
                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={handleAvatarClick}
                                className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                                aria-label={session ? "User menu" : "Login"}
                            >
                                <User className="w-5 h-5 text-gray-700" />
                            </button>

                            {/* User dropdown menu */}
                            {userMenuOpen && session && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {session.user.name || "User"}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {session.user.email}
                                        </p>
                                    </div>

                                    {session.user.role === "ADMIN" && (
                                        <Link
                                            href="/admin"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <Settings className="w-4 h-4" />
                                            Dashboard
                                        </Link>
                                    )}

                                    <Link
                                        href="/orders"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        My Orders
                                    </Link>

                                    <Link
                                        href="/reservation/my"
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                        onClick={() => setUserMenuOpen(false)}
                                    >
                                        <Clock className="w-4 h-4" />
                                        My Reservations
                                    </Link>

                                    <button
                                        onClick={() => {
                                            setUserMenuOpen(false)
                                            signOut({ callbackUrl: "/" })
                                        }}
                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
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
                                    <Settings className="w-4 h-4" />
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

                            <Link
                                href="/reservation/my"
                                className="flex items-center gap-2 text-sm font-medium py-2 text-gray-700"
                                onClick={() => setMenuOpen(false)}
                            >
                                <Clock className="w-4 h-4" />
                                My Reservations
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
                        <Link href="/login" onClick={() => setMenuOpen(false)}>
                            <Button variant="outline" className="w-full flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Login / Sign Up
                            </Button>
                        </Link>
                    )}
                </nav>
            )}
        </header>
    )
} 