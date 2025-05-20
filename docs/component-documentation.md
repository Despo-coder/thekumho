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