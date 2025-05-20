import type { Metadata } from "next";
import { Geist, Geist_Mono, Sawarabi_Mincho, Kaisei_Opti } from "next/font/google";
import "./globals.css";
import Footer from "@/components/footer";
import { Providers } from "./providers";
import { Navbar } from "@/components/navbar";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "./api/uploadthing/core";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${sawarabiMincho.variable} ${kaiseiOpti.variable}`} suppressHydrationWarning>
      <body>
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
      </body>
    </html>
  );
}
