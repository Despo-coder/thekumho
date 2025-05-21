# Lessons Learned

This document captures key lessons, challenges, and solutions encountered during the development of the Timeless Accessories e-commerce platform.

## Architecture & Design

### 1. Hierarchical Data Management

**Challenge:** Implementing a hierarchical category system with proper validation.

**Lesson:** When working with self-referential relationships:
- Always implement validation to prevent circular references
- Optimize recursive checks for performance
- Include proper error messages for easier debugging
- Consider edge cases (such as updating without changing parent)

**Solution:** We implemented a robust check that prevents circular references while allowing updates to existing categories when the parent isn't changing:

```typescript
// Skip circular reference check when parent isn't changing
if (data.parentId !== existingCategory.parentId) {
  const isDescendant = await isChildDescendant(data.id, data.parentId);
  if (isDescendant) {
    return { success: false, error: "Cannot set a descendant category as parent" };
  }
}
```

### 2. State Management

**Challenge:** Managing complex form state with hierarchical selections.

**Lesson:** Use form libraries like React Hook Form with proper validation schemas to handle complex forms. Break down complex UI components into smaller, focused components.

### 3. Next.js 15 Dynamic Routes

**Challenge:** Handling dynamic route parameters in Next.js 15.

**Lesson:** In Next.js 15, dynamic route parameters are now Promise-based and must be awaited:
- Route parameters are now wrapped in a Promise
- Parameters must be awaited before use
- Type definitions need to reflect Promise-based nature
- API routes need to handle Promise-based parameters
- Error handling should account for Promise rejection

**Client Component Solution:**
```typescript
// For client components, use React.use() to unwrap the params Promise
import React from "react";

interface ClientComponentProps {
    params: Promise<{ id: string }>;
}

export default function ClientComponent({ params }: ClientComponentProps) {
    const resolvedParams = React.use(params);
    const id = resolvedParams.id;
    
    // ... rest of the component
}
```

**Server Component Solution:**
```typescript
interface ServerComponentProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function ServerComponent({ params }: ServerComponentProps) {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    // ... rest of the component
}
```

**API Route Solution:**
```typescript
export interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(
    request: Request,
    { params }: RouteParams
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        // ... handle the request
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
```

**Common TypeScript Errors:**
- `Type '{ id: string; }' is not assignable to parameter of type 'Usable<unknown>'`
- `Type '{ id: string; }' is missing properties from type 'Promise<any>'`
- `Type '{ params: { id: string; }; }' does not satisfy the constraint 'PageProps'`

**Key Points:**
1. Always await params before accessing properties
2. Update TypeScript interfaces to reflect Promise-based params
3. Handle potential Promise rejection in API routes
4. Consider loading states while params are resolving
5. Use error boundaries for failed parameter resolution
6. In client components, use React.use() instead of await
7. Ensure all props interfaces correctly type params as a Promise

**Implementation Examples:**
We successfully applied this pattern in our food delivery app:

```typescript
// In orders/[id]/page.tsx (client component)
interface OrderDetailPageProps {
    params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
    const resolvedParams = React.use(params);
    const orderId = resolvedParams.id;
    
    // Now use orderId safely in your component
    useEffect(() => {
        const loadOrder = async () => {
            if (status === 'authenticated' && session?.user?.id && orderId) {
                // ... rest of the code using orderId
            }
        };
        loadOrder();
    }, [orderId, status, session, router]);
    
    // ... rest of component
}
```

### 4. Form Design and UX

**Challenge:** Creating intuitive forms that prevent validation errors during user input.

**Lesson:** Design forms with user experience in mind:
- Use controlled components to manage form state
- Delay validation until appropriate (e.g., on blur or submit)
- Provide clear visual feedback for validation states
- Consider manual actions instead of automatic behavior for derived fields

**Solution:**
```typescript
// Instead of automatic slug generation, use a button
<Button 
    type="button" 
    variant="outline" 
    onClick={() => {
        const name = form.getValues("name");
        if (name && name.length >= 3) {
            form.setValue("slug", slugify(name), { shouldValidate: true });
            sonnerToast.success("Slug generated from name");
        } else {
            sonnerToast.error("Name must be at least 3 characters long");
        }
    }}
>
    Generate
</Button>
```

### 5. Component Organization

**Challenge:** Managing complex UIs with multiple related components.

**Lesson:** Organize components effectively:
- Use a tabbed interface for related form sections
- Create sub-components for logical grouping
- Implement context providers for shared state
- Consider component composition patterns

**Solution:**
```typescript
// Tabs for form organization
<Tabs defaultValue="basic" className="w-full">
    <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="basic">Basic Details</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="image">Images</TabsTrigger>
        <TabsTrigger value="display">Display</TabsTrigger>
    </TabsList>
    <TabsContent value="basic" className="space-y-4">
        <BasicInfoTab />
    </TabsContent>
    {/* Other tab contents */}
</Tabs>
```

## Database

### 1. Connection Issues

**Challenge:** Intermittent database connection issues with cloud PostgreSQL provider (Neon).

**Lesson:** Cloud database providers may have connection limits or timeout policies that affect development. Implement robust connection handling:
- Connection pooling
- Automatic retries
- Proper error handling
- Logging for diagnostics

### 2. Schema Evolution

**Challenge:** Adding fields to existing models with data.

**Lesson:** Plan migrations carefully, especially when adding required fields to existing tables:
- Include default values or make new fields optional
- Consider data backfill strategies
- Test migrations on copy of production data before applying

### 3. Prisma Decimal Types

**Challenge:** Handling Prisma Decimal types in client components.

**Lesson:** Prisma's Decimal type cannot be directly passed to client components. Always convert Decimal values to numbers:
- Convert Decimal to number before sending to client
- Handle null values appropriately
- Consider precision loss implications
- Implement consistent conversion across the application

**Solution:**
```typescript
// Convert Decimal values to numbers before sending to client
const inventoryData = {
    ...data,
    costPrice: Number(data.costPrice),
    retailPrice: Number(data.retailPrice),
    compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
};
```

## Third-party Services

### 1. Image Handling

**Challenge:** Managing image uploads and URLs with UploadThing.

**Lesson:** External services may return different response formats:
- Build adapters to normalize responses
- Add fallbacks for missing values
- Handle errors gracefully
- Test integrations with mock services

```typescript
// Example of defensive URL extraction from UploadThing response
const url = file.ufsUrl || file.url || file.fileUrl || defaultImageUrl;
```

### 2. Payment Integrations

**Challenge:** Integrating multiple payment providers.

**Lesson:** Abstract payment logic behind a unified interface:
- Create provider-specific adapters
- Implement common error handling
- Consider regional requirements
- Test each integration independently

## Development Workflow

### 1. Error Handling & Debugging

**Challenge:** Tracking down issues in server actions and API routes.

**Lesson:** Implement comprehensive logging and debugging:
- Use detailed logs with context information
- Include try/catch blocks with specific error messages
- Implement client-side error reporting
- Consider adding a debug mode toggle

### 2. Performance Optimization

**Challenge:** Maintaining performance with complex database queries.

**Lesson:** Always consider query performance:
- Add appropriate indexes
- Use query builders or ORM features for optimization
- Implement pagination for large data sets
- Consider caching for frequently accessed data

## Future Considerations

### 1. Scalability Planning

As the application grows, consider:
- Implementing microservices for separation of concerns
- Using serverless functions for specific operations
- Adding a CDN for static assets and images
- Implementing database sharding or read replicas

### 2. Security Practices

Always prioritize security:
- Regular dependency updates
- Input validation on both client and server
- Proper authentication and authorization checks
- Rate limiting for public endpoints

## Data Handling
1. **Decimal Type Handling**
   - Prisma's Decimal type needs proper conversion when passing to client components
   - Convert to string/number before sending to client
   - Use proper type checking and conversion
   - Example: `Number(decimalValue.toString())`

2. **Chart Data Types**
   - Recharts expects numeric values for chart data
   - String values need to be converted to numbers
   - Handle type conversion at the data source
   - Validate data types before rendering

3. **Data Aggregation**
   - Use proper filtering instead of find for multiple results
   - Calculate totals correctly for percentages
   - Handle empty or null values gracefully
   - Consider edge cases in data processing

## Chart Implementation
1. **Recharts Best Practices**
   - Use ResponsiveContainer for proper sizing
   - Set appropriate radius values for visibility
   - Add padding between segments
   - Include proper tooltips and labels
   - Handle empty data states

2. **Chart Configuration**
   - Set minimum angles for small segments
   - Use donut chart style for better visibility
   - Add proper spacing between elements
   - Include percentage labels
   - Format tooltip values appropriately

3. **Performance Considerations**
   - Convert data types before rendering
   - Sort data efficiently
   - Handle large datasets properly
   - Consider using memoization for expensive calculations

## Error Handling
1. **Data Validation**
   - Validate data before processing
   - Handle missing or invalid values
   - Provide fallback displays
   - Show meaningful error messages

2. **Type Safety**
   - Use proper TypeScript types
   - Validate data structures
   - Handle edge cases
   - Document type requirements

3. **User Feedback**
   - Show loading states
   - Display error messages clearly
   - Provide fallback content
   - Guide users when data is missing

## Debugging Tips
1. **Chart Issues**
   - Check data types and formats
   - Verify data structure
   - Test with sample data
   - Add console logs for debugging
   - Use React DevTools for component inspection

2. **Data Processing**
   - Log intermediate results
   - Verify calculations
   - Check data transformations
   - Validate type conversions

3. **Performance**
   - Monitor render cycles
   - Check data processing time
   - Verify memory usage
   - Test with different data sizes

## Best Practices
1. **Code Organization**
   - Separate data processing from rendering
   - Use proper type definitions
   - Document complex logic
   - Follow consistent patterns

2. **User Experience**
   - Provide loading states
   - Handle empty data gracefully
   - Show meaningful messages
   - Ensure responsive design

3. **Maintenance**
   - Keep code clean and documented
   - Use consistent naming
   - Follow established patterns
   - Write maintainable code

## Cart and Inventory Management

### 1. Inventory ID vs SKU Usage

**Challenge:** Inconsistent use of inventory IDs and SKUs across the application.

**Lesson:** When dealing with inventory management:
- Be consistent with identifier usage (either ID or SKU, not both)
- Document the chosen approach clearly
- Update all related components to use the same identifier
- Consider the implications of using each type (IDs are internal, SKUs are business-facing)

**Solution:** We standardized on using SKUs for inventory lookups:
```typescript
// Find inventory by SKU consistently
const inventory = await prisma.productInventory.findUnique({
  where: { sku: inventoryId },
});
```

### 2. Cart Item Management

**Challenge:** Managing cart items with multiple inventory variants.

**Lesson:** When implementing cart functionality:
- Use consistent identifiers for inventory items
- Handle inventory availability checks properly
- Implement proper error handling for out-of-stock items
- Consider edge cases like quantity updates

**Solution:** We implemented a robust cart system that:
- Uses SKUs for inventory lookups
- Checks inventory availability before adding items
- Handles quantity updates with proper validation
- Provides clear error messages for users

### 3. Type Safety in Cart Operations

**Challenge:** Ensuring type safety across cart operations.

**Lesson:** When working with cart operations:
- Define clear interfaces for cart items
- Use proper type validation
- Handle edge cases in type definitions
- Consider null/undefined scenarios

**Solution:** We implemented proper type definitions:
```typescript
interface CartItemDetails {
  id: string;
  productId: string;
  inventoryId: string;
  name: string;
  slug: string;
  quantity: number;
  price: number;
  image: string;
  discountPercentage: number | null;
  hasDiscount: boolean;
  maxQuantity: number;
}
```

### 6. Product Attributes Management

**Challenge:** Handling product and inventory attributes with different types and validation requirements.

**Lesson:** When implementing product attributes:
- Properly separate product and inventory attributes
- Handle different attribute types correctly (string, number, boolean, array)
- Implement proper validation for each attribute type
- Consider type conversion when storing and retrieving values
- Handle null/undefined values appropriately

**Current Issues:**
1. Attribute value handling in createProductWithAttributes needs improvement
2. Type conversion for different attribute types is not consistent
3. Validation for attribute values is insufficient
4. Error handling for attribute updates needs enhancement

**Solution Approach:**
```typescript
// Example of proper attribute type handling
interface AttributeValue {
    value: string | number | boolean | string[];
    attributeId: string;
    type: AttributeType;
}

// Separate product and inventory attributes
const productAttributes: AttributeValue[] = [];
const inventoryAttributes: AttributeValue[] = [];

// Handle different attribute types
function processAttributeValue(value: any, type: AttributeType): string {
    switch (type) {
        case AttributeType.ARRAY:
            return JSON.stringify(value);
        case AttributeType.NUMBER:
            return String(Number(value));
        case AttributeType.BOOLEAN:
            return String(Boolean(value));
        default:
            return String(value);
    }
}

// Validate attribute values
function validateAttributeValue(value: any, type: AttributeType): boolean {
    switch (type) {
        case AttributeType.ARRAY:
            return Array.isArray(value);
        case AttributeType.NUMBER:
            return !isNaN(Number(value));
        case AttributeType.BOOLEAN:
            return typeof value === 'boolean';
        default:
            return typeof value === 'string';
    }
}
```

**Key Points:**
1. Always validate attribute values before processing
2. Handle type conversion consistently
3. Separate product and inventory attributes clearly
4. Implement proper error handling
5. Consider edge cases in attribute processing

### 7. Select Component Validation

**Challenge:** Handling validation in Select components, particularly with empty values and placeholder states.

**Lesson:** When working with Select components:
- Never use empty strings as values for Select.Item components
- Use a special value (like "none") for placeholder/empty states
- Handle null/undefined values properly in controlled components
- Consider the implications of value changes on form state

**Solution:**
```typescript
// Instead of using empty string
<SelectItem value="">None</SelectItem>

// Use a special value and handle conversion
<SelectItem value="none">None</SelectItem>

// Handle value changes properly
<Select
    value={field.value || "none"}
    onValueChange={(value) => {
        field.onChange(value === "none" ? null : value);
    }}
>
    <SelectItem value="none">None</SelectItem>
    {/* Other options */}
</Select>
```

**Key Points:**
1. Select.Item components must have non-empty string values
2. Empty strings are reserved for clearing selection
3. Use controlled components for better state management
4. Handle null/undefined values consistently
5. Consider user experience when implementing placeholder states

## Form Submission and Redirect Handling

### Issue: Multiple POST Requests and NEXT_REDIRECT Errors
When implementing form submissions with server actions in Next.js, we encountered issues with multiple POST requests and NEXT_REDIRECT errors. This was particularly evident in the product type creation flow.

#### Problem
- Server-side redirects were causing multiple POST requests
- NEXT_REDIRECT errors were appearing in toast notifications
- Form submissions were being triggered multiple times

#### Solution
We implemented a client-side redirect approach with proper state management:

1. **Server Action Modification**:
```typescript
async function handleCreate(data: { name: string; description?: string }) {
    "use server";
    
    const result = await createProductType(data.name, data.description);
    
    if (result.success) {
        return { success: true }; // Return success instead of redirecting
    } else {
        throw new Error(result.error || "Failed to create product type");
    }
}
```

2. **Form Component Updates**:
```typescript
export function ProductTypeForm({ onSubmit }: ProductTypeFormProps) {
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const mounted = useRef(false);
    const router = useRouter();

    // Track component mounting state
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
        };
    }, []);

    const onSubmitForm = async (data: FormValues) => {
        if (loading || isSubmitting || !mounted.current) return;

        try {
            setLoading(true);
            setIsSubmitting(true);
            const result = await onSubmit(data);

            if (result.success) {
                router.push("/admin/product-types");
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to save");
        } finally {
            setLoading(false);
            setIsSubmitting(false);
        }
    };
}
```

#### Key Learnings
1. **Client vs Server Redirects**:
   - Server-side redirects can cause multiple requests
   - Client-side redirects provide better control over the flow
   - Use `useRouter` for client-side navigation after form submission

2. **State Management**:
   - Track both loading and submission states
   - Use refs to track component mounting state
   - Prevent submissions when component is unmounted

3. **Form Submission Prevention**:
   - Use `e.preventDefault()` in form submission handler
   - Implement multiple checks to prevent duplicate submissions
   - Handle cleanup properly in useEffect

4. **Error Handling**:
   - Provide clear error messages
   - Reset states properly in finally block
   - Use toast notifications for user feedback

#### Best Practices
1. Always handle form submissions on the client side
2. Use proper state management to prevent duplicate submissions
3. Implement proper cleanup in useEffect
4. Provide clear feedback to users
5. Handle errors gracefully
6. Use TypeScript for better type safety

## Product Attributes Handling

### Type Safety and Null Handling
- When working with product attributes stored as JSON in the database, ensure proper type handling:
  * Define clear interfaces for attribute structures
  * Handle null values explicitly in type definitions
  * Use proper type guards when accessing attribute values
  * Consider using discriminated unions for different attribute types

### Read-only Attributes
- For certain product categories, attributes may need to be read-only:
  * Define a configuration object mapping category IDs to read-only status
  * Use this configuration to conditionally render attribute selection UI
  * Ensure proper type safety when accessing category information
  * Consider caching category configurations for performance

### UI Considerations
- When displaying product attributes:
  * Group related attributes together
  * Use appropriate form controls based on attribute type
  * Provide clear labels and descriptions
  * Handle loading and error states gracefully
  * Consider mobile responsiveness
  * Implement proper validation feedback

### Data Transformation
- When transforming data between server and client:
  * Ensure consistent handling of null values
  * Transform dates and special types appropriately
  * Validate data structure at transformation boundaries
  * Consider using Zod for runtime type validation
  * Handle edge cases gracefully

### Error Handling
- Implement robust error handling for attribute operations:
  * Validate attribute values before saving
  * Provide clear error messages for invalid inputs
  * Handle database constraints gracefully
  * Log errors appropriately for debugging
  * Consider implementing retry logic for transient failures

### 4. React Performance Optimization

**Challenge:** Preventing unnecessary renders due to function recreations in useEffect dependencies.

**Lesson:** Functions defined in component scope are recreated on each render, causing useEffect to run more often than necessary.

**Solution:**
```typescript
import { useCallback } from 'react';

// Wrap functions used in useEffect in useCallback
const fetchData = useCallback(async () => {
    try {
        // Function logic here
    } catch (error) {
        console.error("Error:", error);
    }
}, []); // Empty dependency array for functions with no dependencies

useEffect(() => {
    // Effect using the memoized function
    fetchData();
}, [fetchData]); // Now fetchData is stable between renders
```

**Key Points:**
1. Use useCallback for functions in useEffect dependencies
2. Include all dependencies the function uses in the useCallback dependency array
3. For simple data fetching that doesn't depend on props/state, an empty array is appropriate
4. This pattern reduces unnecessary API calls and renders

## Order Management and Stripe Integration

### 1. Cookie Access in Server Components

**Challenge:** Accessing cookies directly in server components causing TypeScript errors with Next.js's cookies() API.

**Lesson:** The `cookies()` API in Next.js 14+ returns a Promise, causing type compatibility issues in server components.

**Solution:** Use a client-side cookie utility that doesn't rely on Next.js API:

```typescript
// In lib/cookies.ts (client component)
'use client';

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function setCookie(name: string, value: string, options = {}): void {
  if (typeof document === 'undefined') return;
  
  // Set cookie implementation...
  document.cookie = cookie;
}
```

**Key Points:**
1. Use the `'use client'` directive for cookie utilities
2. Handle SSR safely by checking for `document` before accessing cookies
3. Pass cookie data to server components instead of trying to read cookies in server components
4. This approach provides clear separation between client and server concerns

### 2. Order Creation Flow

**Challenge:** Implementing a proper order creation and payment flow with Stripe.

**Lesson:** Orders must be created in the database before initiating payment, and the order ID must be passed to Stripe.

**Solution:** 
1. Create server actions for order creation
2. Create a separate function for initiating Stripe checkout
3. Include the order ID in Stripe metadata
4. Process webhooks to update order status

```typescript
// Order creation server action
export async function createOrder(userId: string, orderData: OrderData): Promise<OrderResult> {
  // Create order in database first
  // Return the order ID
}

// Checkout session creation
export async function createCheckoutSession(userId: string, cart: CartItem[], orderData: OrderData): Promise<CheckoutResult> {
  // Create order first
  const orderResult = await createOrder(userId, {...orderData, items: cart});
  
  // Then create Stripe checkout session with order ID in metadata
  const session = await stripe.checkout.sessions.create({
    metadata: {
      orderId: orderResult.orderId,
      // Other metadata
    },
    // Other session details
  });
  
  return { success: true, url: session.url };
}
```

**Key Points:**
1. Always create the order in your database before initiating payment
2. Include the order ID in the payment metadata
3. Use webhooks to update the order status based on payment outcomes
4. Keep the payment flow separate from the order creation logic

### 3. Stripe Webhook Handling

**Challenge:** Properly processing and verifying Stripe webhook events.

**Lesson:** Webhook signature verification is critical for security but can be tricky to implement correctly.

**Solution:**
```typescript
export async function POST(req: NextRequest) {
  try {
    // Get the raw request body and signature header
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    
    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    
    // Process different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        // Update order status
        break;
      // Handle other events
    }
    
    return NextResponse.json({ received: true });
  } catch (error) {
    // Handle errors
    return NextResponse.json(
      { error: 'Webhook error' },
      { status: 400 }
    );
  }
}
```

**Key Points:**
1. Always verify webhook signatures to prevent fraud
2. Use the raw request body for signature verification
3. Handle different event types with specific logic
4. Return appropriate status codes for Stripe to know if it should retry

### 4. Type Conversion for Prices

**Challenge:** Handling price data types consistently between client, database, and Stripe.

**Lesson:** Price data needs explicit type conversion to avoid errors when moving between systems.

**Solution:**
```typescript
// When creating orders
const order = await prisma.order.create({
  data: {
    total: Number(orderData.total),
    items: {
      create: orderData.items.map(item => ({
        price: Number(item.price),
        // Other item fields
      }))
    }
  }
});

// When creating Stripe line items
const lineItems = items.map(item => ({
  price_data: {
    currency: 'usd',
    unit_amount: Math.round(Number(item.price) * 100), // Convert to cents
    // Other price data
  },
  quantity: item.quantity
}));
```

**Key Points:**
1. Always use explicit Number() conversion for price values
2. Remember to convert dollars to cents for Stripe (multiply by 100)
3. Use Math.round() to avoid floating-point issues
4. Be consistent with price handling throughout the codebase

## TypeScript Best Practices

### 6. Proper Type Definitions for API Responses

**Challenge:** Handling TypeScript errors with API data structures, particularly in the menu management system.

**Lesson:** Always define explicit types for API responses and data transformations:
- Create comprehensive type definitions for all API responses
- Explicitly type arrays and transformation results
- Include optional properties for error handling
- Type function parameters in callbacks

**Solution:**

We resolved TypeScript errors in our menu management system by implementing proper type definitions:

```typescript
// Define explicit types for API responses
type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number | bigint;
  image: string | null;
  isAvailable: boolean;
  menu: { id: string; name: string };
};

type Category = {
  id: string;
  name: string;
  items: MenuItem[];
};

type MenuApiResponse = {
  categories?: Category[];
  error?: string;
};

// Explicitly type transformation results
let menuItems: (MenuItem & { category: { id: string; name: string } })[] = [];

// Type function parameters in callbacks
data.categories.forEach((category: Category) => {
  if (category.items && Array.isArray(category.items)) {
    // Add category info to each item
    const itemsWithCategory = category.items.map((item: MenuItem) => ({
      ...item,
      category: {
        id: category.id,
        name: category.name
      }
    }));
    menuItems = [...menuItems, ...itemsWithCategory];
  }
});
```

This approach ensures type safety throughout the application and provides better developer experience with intelligent code completion and early error detection.
