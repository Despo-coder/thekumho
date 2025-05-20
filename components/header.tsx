'use client'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState } from "react"
// Removing unused import
// import Image from "next/image"

export function Header() {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 w-full bg-white border-b">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2">

                    <h6 className="text-2xl  font-kaiseiOpti font-semibold font-stretch-50% text-orange-500">THE KUMO</h6>
                </Link>

                {/* Hamburger for mobile */}
                <button
                    className="md:hidden flex items-center px-2 py-1"
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                </button>

                {/* Desktop nav */}
                <nav className="hidden md:flex gap-6">
                    <Link href="#how-it-works" className="text-sm font-medium">
                        How it works
                    </Link>
                    <Link href="#meals" className="text-sm font-medium">
                        Meals
                    </Link>
                    <Link href="#testimonials" className="text-sm font-medium">
                        Testimonials
                    </Link>
                    <Link href="#pricing" className="text-sm font-medium">
                        Pricing
                    </Link>
                </nav>
                <div className="hidden md:block">
                    <Button className="bg-orange-500 hover:bg-orange-600">Try for free</Button>
                </div>
            </div>
            {/* Mobile nav */}
            {menuOpen && (
                <nav className="md:hidden bg-white border-t px-4 py-2 flex flex-col gap-2">
                    <Link href="#how-it-works" className="text-sm font-medium" onClick={() => setMenuOpen(false)}>
                        How it works
                    </Link>
                    <Link href="#meals" className="text-sm font-medium" onClick={() => setMenuOpen(false)}>
                        Meals
                    </Link>
                    <Link href="#testimonials" className="text-sm font-medium" onClick={() => setMenuOpen(false)}>
                        Testimonials
                    </Link>
                    <Link href="#pricing" className="text-sm font-medium" onClick={() => setMenuOpen(false)}>
                        Pricing
                    </Link>
                    <Button className="bg-orange-500 hover:bg-orange-600 w-full mt-2" onClick={() => setMenuOpen(false)}>
                        Try for free
                    </Button>
                </nav>
            )}
        </header>
    )
}
