# Component Documentation

This document outlines the key UI components used in the Restaurant Application.

## Layout Components

### `layout.tsx`

The main application layout wrapper that includes:
- Global providers
- Navbar
- Footer

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

### `Providers`

Wraps the application with various providers:
- NextAuthProvider: Authentication context
- Other global contexts as needed

```tsx
// app/providers.tsx
'use client';

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

### `Navbar`

The main navigation component that:
- Displays the restaurant logo
- Shows navigation links
- Shows authentication status
- Conditionally displays admin dashboard link based on user role

```tsx
// components/navbar.tsx
'use client';

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session } = useSession();
  
  return (
    <nav>
      <div className="logo">
        <Link href="/">Restaurant Name</Link>
      </div>
      
      <div className="nav-links">
        <Link href="/menu">Menu</Link>
        <Link href="/reservation">Reservations</Link>
        
        {session ? (
          <>
            <Link href="/orders">My Orders</Link>
            {['ADMIN', 'MANAGER', 'CHEF', 'WAITER'].includes(session.user.role) && (
              <Link href="/admin">Dashboard</Link>
            )}
            <Link href="/api/auth/signout">Sign Out</Link>
          </>
        ) : (
          <>
            <Link href="/login">Login</Link>
            <Link href="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
```

## Page Components

### `HomePage`

The landing page component with:
- Hero section
- Featured menu items
- Testimonials
- CTA sections

### `MenuPage`

Displays the restaurant menu:
- Categories of menu items
- Filtering by dietary preferences
- Menu item cards with images and prices

```tsx
// app/menu/page.tsx
export default async function MenuPage() {
  const categories = await getMenuItems();

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold text-center mb-12">Our Menu</h1>

      <div className="filter-controls">
        {/* Dietary filter buttons */}
      </div>

      {categories.map((category) => (
        <div key={category.id} className="category-section">
          <h2>{category.name}</h2>
          <div className="menu-items-grid">
            {category.items.map((item) => (
              <MenuItemCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

### `ReservationPage`

Allows users to make table reservations:
- Form for reservation details
- Date and time pickers
- Validation and submission

### `OrdersPage`

Displays user's order history:
- List of past orders
- Order details and status
- Order tracking information

### `AdminDashboard`

Admin dashboard with tabs for different management areas:
- Overview with key stats
- Orders management
- Bookings management
- Menu management
- User management (admin only)

```tsx
// app/admin/page.tsx
'use client';

export default function AdminDashboard() {
  const { data: session } = useSession();
  
  return (
    <div className="admin-dashboard">
      <h1>Staff Dashboard</h1>
      
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="menu">Menu</TabsTrigger>
          {session?.user.role === "ADMIN" && (
            <TabsTrigger value="users">Users</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="overview">
          {/* Dashboard stats cards */}
        </TabsContent>
        
        <TabsContent value="orders">
          {/* Orders management UI */}
        </TabsContent>
        
        {/* Other tab contents */}
      </Tabs>
    </div>
  );
}
```

## UI Components

These are reusable UI components, many of which use shadcn/ui as a foundation.

### `Button`

Primary button component with variants:
- Default
- Outline
- Ghost
- Link

```tsx
// components/ui/button.tsx
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-orange-600 text-white hover:bg-orange-700",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### `Card`

Card component for displaying content in a box:

```tsx
// components/ui/card.tsx
import { cn } from "@/lib/utils";

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
```

### `Tabs`

Component for tabbed interfaces:

```tsx
// components/ui/tabs.tsx
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
```

## Feature Components

### `MenuItemCard`

Displays a menu item with image, details, and actions:

```tsx
// components/menu-item-card.tsx
export default function MenuItemCard({ item }) {
  return (
    <div className="menu-item-card">
      <div className="image-container">
        {item.image ? (
          <Image src={item.image} alt={item.name} fill className="object-cover" />
        ) : (
          <div className="placeholder">No image</div>
        )}
      </div>
      
      <div className="content">
        <div className="header">
          <h3>{item.name}</h3>
          <span className="price">${Number(item.price).toFixed(2)}</span>
        </div>
        
        <p className="description">{item.description}</p>
        
        <div className="dietary-tags">
          {item.isVegetarian && <span className="tag vegetarian">Vegetarian</span>}
          {item.isVegan && <span className="tag vegan">Vegan</span>}
          {item.isGlutenFree && <span className="tag gluten-free">Gluten Free</span>}
        </div>
        
        <div className="actions">
          <Link href={`/menu/${item.id}`}>View details</Link>
          <Button>Add to order</Button>
        </div>
      </div>
    </div>
  );
}
```

### `ReservationForm`

Form for creating a table reservation:

```tsx
// components/reservation-form.tsx
'use client';

export default function ReservationForm() {
  const { data: session } = useSession();
  const [formData, setFormData] = useState({
    customerName: session?.user?.name || "",
    email: session?.user?.email || "",
    phone: "",
    partySize: 2,
    bookingDate: "",
    bookingTime: "",
    specialRequest: "",
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Form submission logic
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields for name, email, phone, etc. */}
      <Button type="submit">Book Table</Button>
    </form>
  );
}
```

### `OrderCard`

Displays a single order with its details:

```tsx
// components/order-card.tsx
export default function OrderCard({ order }) {
  const getStatusColor = (status) => {
    // Return appropriate color class based on status
  };
  
  return (
    <div className="order-card">
      <div className="header">
        <div>
          <div>Order #{order.orderNumber}</div>
          <div>{formatDate(order.createdAt)}</div>
        </div>
        <div className="status-badges">
          <span className={getStatusColor(order.status)}>
            {order.status.replace("_", " ")}
          </span>
          <span className={getPaymentStatusColor(order.paymentStatus)}>
            {order.paymentStatus}
          </span>
        </div>
      </div>
      
      <div className="items">
        {order.items?.map((item) => (
          <div key={item.id} className="order-item">
            <div className="item-info">
              <span className="quantity">{item.quantity}x</span>
              <span>{item.menuItem.name}</span>
            </div>
            <span className="price">
              ${(item.price * item.quantity).toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      
      <div className="total">
        <span>Total</span>
        <span>${Number(order.total).toFixed(2)}</span>
      </div>
    </div>
  );
}
```

### `StatCard`

Used in the admin dashboard to display statistics:

```tsx
// components/stat-card.tsx
export default function StatCard({ title, value, icon, description }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-500">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-gray-500">{description}</p>
      </CardContent>
    </Card>
  );
}
```

## Utility Components

### `cn` (Utility Function)

Used for conditionally joining class names:

```tsx
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## Context Providers

### `AuthProvider`

Wraps the application with the NextAuth SessionProvider to provide authentication state.

```tsx
// app/providers.tsx
'use client';

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

### `CartProvider`

Manages the shopping cart state across the application.

```tsx
// lib/cart/CartContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from "react";

type CartItem = {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
  image?: string | null;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  
  // Initialize cart from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading cart from localStorage', error);
    }
  }, []);
  
  // Save cart to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);
  
  // Calculate total
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // Calculate item count
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);
  
  // Add item to cart
  const addToCart = (newItem: CartItem) => {
    setItems(currentItems => {
      const existingItem = currentItems.find(item => item.menuItemId === newItem.menuItemId);
      
      if (existingItem) {
        return currentItems.map(item => 
          item.menuItemId === newItem.menuItemId 
            ? { ...item, quantity: item.quantity + newItem.quantity, specialInstructions: newItem.specialInstructions || item.specialInstructions }
            : item
        );
      } else {
        return [...currentItems, newItem];
      }
    });
  };
  
  // Remove item from cart
  const removeFromCart = (menuItemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.menuItemId !== menuItemId));
  };
  
  // Update item quantity
  const updateQuantity = (menuItemId: string, quantity: number) => {
    setItems(currentItems => 
      currentItems.map(item => 
        item.menuItemId === menuItemId ? { ...item, quantity } : item
      )
    );
  };
  
  // Clear cart
  const clearCart = () => {
    setItems([]);
  };
  
  return (
    <CartContext.Provider value={{ 
      items, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart, 
      itemCount,
      total
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
```

## Order System Components

### `CartButton`

Navigation bar button that displays the current cart item count and provides a dropdown to view cart contents.

```tsx
// components/cart/CartButton.tsx
'use client';

import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/CartContext";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export function CartButton() {
  const { items, itemCount, total, removeFromCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  
  const toggleCart = () => setIsOpen(!isOpen);
  
  return (
    <div className="relative">
      <button 
        onClick={toggleCart}
        className="flex items-center text-gray-700 hover:text-orange-600"
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white shadow-xl rounded-md z-50">
          <div className="p-4">
            <h3 className="text-lg font-bold border-b pb-2">Your Cart</h3>
            
            {items.length === 0 ? (
              <p className="py-4 text-center text-gray-500">Your cart is empty</p>
            ) : (
              <>
                <ul className="divide-y">
                  {items.map(item => (
                    <li key={item.menuItemId} className="py-2 flex">
                      <div className="flex-grow">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          {item.quantity} × {formatCurrency(item.price)}
                        </p>
                      </div>
                      <button 
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="text-red-500 text-sm hover:text-red-700"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                
                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                  <span>Total:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                
                <div className="mt-4">
                  <Link
                    href="/cart"
                    className="block w-full bg-orange-600 hover:bg-orange-700 text-white text-center py-2 rounded-md"
                    onClick={() => setIsOpen(false)}
                  >
                    View Cart
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### `CartPage`

A dedicated page component for reviewing and managing cart contents.

```tsx
// app/cart/page.tsx
'use client';

import { Minus, Plus, Trash } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart/CartContext";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, total, itemCount } = useCart();
  
  const handleQuantityChange = (menuItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(menuItemId, newQuantity);
  };
  
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
      
      {items.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-medium mb-4">Your cart is empty</h2>
          <p className="mb-8 text-gray-600">Add some delicious items from our menu!</p>
          <Link 
            href="/menu" 
            className="inline-block bg-orange-600 hover:bg-orange-700 text-white py-2 px-6 rounded-md"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <ul className="divide-y">
              {items.map(item => (
                <li key={item.menuItemId} className="py-6 flex">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                    {item.image ? (
                      <Image 
                        src={item.image} 
                        alt={item.name}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover object-center"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-500 text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex flex-1 flex-col">
                    <div>
                      <div className="flex justify-between text-base font-medium">
                        <h3>{item.name}</h3>
                        <p className="ml-4">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                      {item.specialInstructions && (
                        <p className="mt-1 text-sm text-gray-500">
                          {item.specialInstructions}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-1 items-end justify-between text-sm">
                      <div className="flex items-center border rounded-md">
                        <button
                          onClick={() => handleQuantityChange(item.menuItemId, item.quantity - 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-3 py-1 border-l border-r">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item.menuItemId, item.quantity + 1)}
                          className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.menuItemId)}
                        className="text-red-600 hover:text-red-800 flex items-center"
                      >
                        <Trash className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg h-fit">
            <h2 className="text-lg font-medium mb-4">Order Summary</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <p>Subtotal ({itemCount} items)</p>
                <p>{formatCurrency(total)}</p>
              </div>
              
              <div className="border-t border-gray-200 my-4 pt-4">
                <div className="flex justify-between font-medium text-lg">
                  <p>Total</p>
                  <p>{formatCurrency(total)}</p>
                </div>
              </div>
              
              <Link
                href="/checkout"
                className="mt-6 block w-full bg-orange-600 hover:bg-orange-700 text-white text-center py-3 rounded-md font-medium"
              >
                Proceed to Checkout
              </Link>
              
              <Link
                href="/menu"
                className="mt-2 block w-full text-center py-2 text-orange-600 hover:text-orange-700"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## New Admin Components (Recently Added)

### `OrdersManagement`

Comprehensive order management component with:
- Real-time order table with search and filtering
- Order status progression workflow
- Print receipt and kitchen ticket functionality
- Order details modal with complete information
- Pagination for large order lists

```tsx
// components/OrdersManagement.tsx
export default function OrdersManagement() {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "">("");
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Orders Management</CardTitle>
          <div className="flex gap-4">
            <Input placeholder="Search orders..." />
            <select>Status Filter</select>
            <Button>Refresh</Button>
          </div>
        </CardHeader>
        <CardContent>
          <table>
            {/* Order rows with status management */}
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
```

### `OrderAnalytics`

Advanced analytics dashboard for order insights:
- Revenue analytics with date range filtering
- Popular items analysis
- Order completion metrics and performance tracking
- Customer analytics and segmentation
- Order history with export functionality

```tsx
// components/OrderAnalytics.tsx
export default function OrderAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Order Analytics</CardTitle>
            <div className="flex items-center space-x-4">
              <Input type="date" />
              <Button>Refresh</Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs>
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="popular">Popular Items</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>
        
        {/* Tab contents with analytics data */}
      </Tabs>
    </div>
  );
}
```

### `BookingsManagement`

Comprehensive reservation management component with:
- Real-time booking table with search and filtering  
- Booking status progression workflow (Pending → Confirmed → Completed)
- Create new bookings for walk-ins and phone reservations
- Today's bookings quick view with streamlined interface
- Booking details modal with complete customer information
- Pagination and advanced filtering options

```tsx
// components/BookingsManagement.tsx
export default function BookingsManagement() {
  const [bookings, setBookings] = useState<BookingWithCustomer[]>([]);
  const [todayBookings, setTodayBookings] = useState<BookingWithCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Booking statistics */}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="today">Today</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {/* Full booking management table */}
        </TabsContent>
        
        <TabsContent value="today">
          {/* Today's bookings simplified view */}
        </TabsContent>
      </Tabs>
      
      {/* Booking details and creation modals */}
    </div>
  );
}
```

## Server Actions (Recently Added)

### Order Management Actions

Located in `lib/actions/order-actions.ts`:
- `getDashboardStats()`: Real-time dashboard statistics
- `getOrders()`: Paginated orders with filtering
- `updateOrderStatus()`: Order status progression
- `getRecentActivity()`: Recent orders/bookings for dashboard

### Order Analytics Actions

Located in `lib/actions/order-analytics-actions.ts`:
- `getRevenueAnalytics()`: Revenue trends and breakdowns
- `getPopularItems()`: Most ordered items analysis
- `getOrderCompletionMetrics()`: Performance and timing metrics
- `getCustomerAnalytics()`: Customer segmentation and insights
- `getOrderHistory()`: Advanced filtering and export capabilities

### Receipt & Printing Actions

Located in `lib/actions/receipt-actions.ts`:
- `generateCustomerReceipt()`: Complete customer receipt data
- `generateKitchenTicket()`: Kitchen-focused order information
- `generateReceiptHTML()`: Styled HTML receipt for printing
- `generateKitchenTicketHTML()`: Kitchen ticket with preparation details

### Booking Management Actions

Located in `lib/actions/booking-actions.ts`:
- `getBookingStats()`: Comprehensive booking statistics for dashboard
- `getBookings()`: Paginated bookings with filtering by status, date, and search
- `updateBookingStatus()`: Booking status progression with table assignment
- `createBooking()`: Create new bookings for walk-ins and phone reservations
- `deleteBooking()`: Remove bookings with proper authorization
- `getTodayBookings()`: Quick access to today's reservations

## Key Features Implemented

1. **Real-time Dashboard**: Auto-refreshing overview with key metrics
2. **Order Status Management**: One-click progression through order lifecycle
3. **Reservation Management**: Complete booking CRUD with status workflow
4. **Advanced Analytics**: Comprehensive business insights and reporting
5. **Print System**: Professional receipts and kitchen tickets
6. **Type Safety**: Full TypeScript integration with proper interfaces
7. **Error Handling**: Comprehensive error management throughout 