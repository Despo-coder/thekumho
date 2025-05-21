import type { Metadata } from "next";
import { Geist, Geist_Mono, Sawarabi_Mincho, Kaisei_Opti } from "next/font/google";
import "./globals.css";
import Footer from "@/components/footer";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "./api/uploadthing/core";
import { CartProvider } from "@/lib/cart/CartContext";
import { Cart } from "@/components/ui/Cart";
import { CartButton } from "@/components/ui/CartButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sawarabiMincho = Sawarabi_Mincho({
  variable: "--font-sawarabi-mincho",
  subsets: ["latin"],
  weight: "400"
});

const kaiseiOpti = Kaisei_Opti({
  variable: "--font-kaisei-opti",
  subsets: ["latin"],
  weight: "400"
});

export const metadata: Metadata = {
  title: "The Kumho Restaurant",
  description: "Order food and make reservations",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${sawarabiMincho.variable} ${kaiseiOpti.variable}`} suppressHydrationWarning>
      <body>
        <CartProvider>
          <Providers>
            <NextSSRPlugin
              /**
               * The extractRouterConfig will extract only the route configs
               * from the router to prevent additional information from being
               * leaked to the client.
               */
              routerConfig={extractRouterConfig(ourFileRouter)}
            />
            <Navbar />
            <main>
              {children}
            </main>
            <Footer />
          </Providers>

          <header className="border-b bg-white sticky top-0 z-40">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                {/* Logo and navigation */}
                <div className="flex items-center">
                  <Link href="/" className="text-xl font-bold text-orange-600">
                    Restaurant
                  </Link>
                  <nav className="ml-10 hidden space-x-8 md:flex">
                    <Link href="/" className="text-gray-700 hover:text-orange-600">
                      Home
                    </Link>
                    <Link href="/menu" className="text-gray-700 hover:text-orange-600">
                      Menu
                    </Link>
                    <Link href="/about" className="text-gray-700 hover:text-orange-600">
                      About
                    </Link>
                    <Link href="/contact" className="text-gray-700 hover:text-orange-600">
                      Contact
                    </Link>
                  </nav>
                </div>

                {/* Right side buttons */}
                <div className="flex items-center space-x-4">
                  {/* Cart button - client component */}
                  <div className="ml-4">
                    <CartButton />
                  </div>

                  {/* Auth links */}
                  {session ? (
                    <Link href="/account" className="text-gray-700 hover:text-orange-600">
                      Account
                    </Link>
                  ) : (
                    <Link href="/login" className="text-gray-700 hover:text-orange-600">
                      Login
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </header>

          <footer className="bg-gray-800 text-white py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-bold mb-4">Restaurant</h3>
                  <p className="text-gray-400">
                    Serving delicious food with great service since 2010.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-4">Opening Hours</h3>
                  <p className="text-gray-400">Monday - Friday: 9am - 10pm</p>
                  <p className="text-gray-400">Saturday - Sunday: 10am - 11pm</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-4">Contact</h3>
                  <p className="text-gray-400">123 Restaurant Street</p>
                  <p className="text-gray-400">contact@restaurant.com</p>
                  <p className="text-gray-400">(123) 456-7890</p>
                </div>
              </div>
              <div className="mt-8 pt-8 border-t border-gray-700">
                <p className="text-gray-400 text-center">
                  &copy; {new Date().getFullYear()} Restaurant. All rights reserved.
                </p>
              </div>
            </div>
          </footer>

          {/* Cart - client component */}
          <Cart />
        </CartProvider>
      </body>
    </html>
  );
}
