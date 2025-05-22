# Troubleshooting Guide

This document provides solutions for common issues that may arise when developing, deploying, or using the Restaurant Application.

## Database Connection Issues

### Problem: Unable to connect to the database

**Symptoms:**
- Error message: `Error: P1001: Can't reach database server`
- Error message: `Error: P1003: Database does not exist`

**Possible Solutions:**

1. **Check database credentials:**
   ```
   # Verify the DATABASE_URL in your .env file
   DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_db"
   ```

2. **Verify database is running:**
   ```bash
   # For PostgreSQL
   pg_isready -h localhost -p 5432
   ```

3. **Create the database if it doesn't exist:**
   ```bash
   createdb restaurant_db
   # or
   psql -c "CREATE DATABASE restaurant_db;"
   ```

4. **Reset Prisma client:**
   ```bash
   npx prisma generate
   ```

5. **Check for network issues:**
   - Make sure your database allows connections from your application's IP
   - Check firewall settings
   - Verify VPN isn't causing connectivity issues

### Problem: Prisma migration errors

**Symptoms:**
- Error message: `Error: P3006: Migration cannot be rolled back`
- Error message: `Error: P3005: The migration is already applied`

**Possible Solutions:**

1. **Reset development database (DEVELOPMENT ONLY):**
   ```bash
   npx prisma migrate reset --force
   ```

2. **Manually fix migration state:**
   ```bash
   # Check migration history
   npx prisma migrate status
   
   # Resolve issues
   psql -d restaurant_db -c "DELETE FROM \"_prisma_migrations\" WHERE migration_name = 'problematic_migration'"
   ```

## Authentication Issues

### Problem: Unable to login

**Symptoms:**
- Login form submits but redirects back with error
- No error message but authentication fails

**Possible Solutions:**

1. **Verify NextAuth configuration:**
   ```bash
   # Check .env file for correct values
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

2. **Check credentials in database:**
   ```bash
   # Use Prisma Studio to view user records
   npx prisma studio
   ```
   
3. **Reset user password (development):**
   ```bash
   # Generate new password hash
   node -e "console.log(require('bcrypt').hashSync('NewPassword123!', 10))"
   
   # Then update in Prisma Studio or via SQL
   ```

4. **Clear browser cookies and try again**

### Problem: Session not persisting

**Symptoms:**
- User is logged out after page refresh
- Authentication state keeps resetting

**Possible Solutions:**

1. **Check NextAuth provider setup:**
   ```tsx
   // Verify in your app/providers.tsx
   export default function Providers({ children }: { children: React.ReactNode }) {
     return <SessionProvider>{children}</SessionProvider>;
   }
   ```

2. **Verify session callback in NextAuth config:**
   ```tsx
   // Check app/api/auth/[...nextauth]/options.ts
   callbacks: {
     async session({ session, token }) {
       if (token && session.user) {
         session.user.id = token.sub as string;
         session.user.role = token.role as Role;
       }
       return session;
     }
   }
   ```

3. **Check for cookie issues:**
   - Ensure your browser accepts cookies
   - Check for SameSite cookie issues in cross-domain setups

## API Request Issues

### Problem: API requests returning 401/403 errors

**Symptoms:**
- API calls fail with 401 Unauthorized or 403 Forbidden
- Console shows CORS errors

**Possible Solutions:**

1. **Check authentication state:**
   - Verify user is logged in
   - Check if token is included in request

2. **Verify user permissions:**
   - Confirm user has the required role to access the endpoint
   - Check role-based logic in API route handlers

3. **Handle CORS issues:**
   ```tsx
   // Check if you need to add CORS headers
   export async function GET(request: Request) {
     return new Response(JSON.stringify(data), {
       headers: {
         'Content-Type': 'application/json',
         'Access-Control-Allow-Origin': '*',
         'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
         'Access-Control-Allow-Headers': 'Content-Type, Authorization',
       },
     });
   }
   ```

### Problem: API returns 500 internal server error

**Symptoms:**
- Server responds with 500 status code
- Error logs show unhandled exceptions

**Possible Solutions:**

1. **Check server logs for detailed error:**
   - Look for error messages in the terminal
   - Check application logs in your hosting platform

2. **Improve error handling in API routes:**
   ```tsx
   export async function GET(request: Request) {
     try {
       // API logic here
       return Response.json(data);
     } catch (error) {
       console.error("API error:", error);
       return Response.json(
         { message: "An unexpected error occurred" },
         { status: 500 }
       );
     }
   }
   ```

3. **Verify database operations have proper error handling**

## UI and Rendering Issues

### Problem: Components not rendering correctly

**Symptoms:**
- Blank areas where content should appear
- React error messages in console
- Hydration errors

**Possible Solutions:**

1. **Check for client/server component conflicts:**
   - Ensure 'use client' directive is added to client components
   - Move state and effects to client components

2. **Fix hydration errors:**
   ```tsx
   // Add key props to dynamic lists
   {items.map((item) => (
     <Component key={item.id} item={item} />
   ))}
   
   // Use useEffect for browser-only code
   useEffect(() => {
     // Browser-only code here
   }, []);
   ```

3. **Check for missing dependencies in package.json**

### Problem: Styling issues

**Symptoms:**
- CSS not applying correctly
- Layout breaks on certain screen sizes
- UI elements misaligned

**Possible Solutions:**

1. **Verify Tailwind configuration:**
   ```bash
   # Check if Tailwind is processing your CSS
   npx tailwindcss -i ./app/globals.css -o ./styles.css
   ```

2. **Check browser compatibility:**
   - Test in different browsers
   - Use can-i-use.com to verify CSS feature support

3. **Fix responsive issues:**
   - Add responsive classes
   - Use browser dev tools to debug layout

## Build and Deployment Issues

### Problem: Build fails during deployment

**Symptoms:**
- Error in CI/CD pipeline
- Local build works but deployment fails

**Possible Solutions:**

1. **Check for environment differences:**
   - Verify all required env variables are set in deployment
   - Check Node.js version compatibility

2. **Look for TypeScript errors:**
   ```bash
   # Run TypeScript check
   npx tsc --noEmit
   ```

3. **Check for path case sensitivity issues:**
   - Rename imports to match exact case of file paths
   - Be consistent with file naming conventions

### Problem: Application crashes after deployment

**Symptoms:**
- Application works locally but crashes in production
- Error logs show runtime errors

**Possible Solutions:**

1. **Check runtime environment:**
   - Verify Node.js version on server
   - Check for missing dependencies

2. **Look for environment-specific code:**
   ```tsx
   // Fix code that assumes development environment
   if (process.env.NODE_ENV === 'development') {
     // Development-only code
   } else {
     // Production-safe code
   }
   ```

3. **Enable source maps in production for better debugging:**
   ```js
   // next.config.js
   module.exports = {
     productionBrowserSourceMaps: true,
   }
   ```

## Performance Issues

### Problem: Slow page loading

**Symptoms:**
- Pages take a long time to load
- Lighthouse score shows poor performance

**Possible Solutions:**

1. **Optimize image usage:**
   - Use Next.js Image component
   - Properly size and compress images

2. **Implement data fetching optimizations:**
   ```tsx
   // Add caching to data fetches
   export const revalidate = 3600; // Revalidate at most once per hour
   ```

3. **Check for excessive server-side computation:**
   - Move heavy processing to API routes
   - Implement caching for expensive operations

4. **Optimize database queries:**
   - Add proper indexes
   - Review and optimize Prisma queries

### Problem: Database performance degradation

**Symptoms:**
- Operations become slower over time
- Database-related errors increase

**Possible Solutions:**

1. **Add indexes to frequently queried fields:**
   ```prisma
   // In schema.prisma
   model Order {
     id        String   @id @default(cuid())
     createdAt DateTime @default(now())
     
     @@index([createdAt])
   }
   ```

2. **Optimize expensive queries:**
   - Use `select` to fetch only needed fields
   - Use `take` and pagination for large result sets

3. **Consider database maintenance:**
   ```bash
   # PostgreSQL vacuum
   psql -d restaurant_db -c "VACUUM ANALYZE;"
   ```

## Specific Feature Issues

### Problem: Reservations not showing in admin dashboard

**Symptoms:**
- Reservations are created but not visible in admin dashboard
- No error messages in console

**Possible Solutions:**

1. **Check reservation fetching logic:**
   ```tsx
   // Verify API route is fetching correctly
   export async function GET(request: Request) {
     const bookings = await prisma.booking.findMany({
       include: { table: true },
       orderBy: { bookingTime: 'asc' },
     });
     return Response.json(bookings);
   }
   ```

2. **Verify admin dashboard component:**
   - Check if component is fetching data correctly
   - Ensure loading and error states are handled

3. **Test API endpoint directly:**
   ```bash
   curl -X GET http://localhost:3000/api/bookings -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
   ```

### Problem: Order processing issues

**Symptoms:**
- Orders get stuck in certain statuses
- Status updates don't persist

**Possible Solutions:**

1. **Check order status update logic:**
   ```tsx
   // Verify the update function
   async function updateOrderStatus(id: string, status: OrderStatus) {
     try {
       const updatedOrder = await prisma.order.update({
         where: { id },
         data: { status },
       });
       
       // Also create status update record
       await prisma.orderStatusUpdate.create({
         data: {
           orderId: id,
           status,
           updatedById: session.user.id,
         },
       });
       
       return updatedOrder;
     } catch (error) {
       console.error('Error updating order:', error);
       throw error;
     }
   }
   ```

2. **Check transaction handling:**
   - Use Prisma transactions for related updates
   - Ensure error handling is robust

3. **Verify client-side state updates:**
   - Check if UI is reflecting the latest state
   - Implement proper optimistic updates

## Environment and Setup Issues

### Problem: Development environment setup fails

**Symptoms:**
- npm install fails
- Startup errors after clean installation

**Possible Solutions:**

1. **Check Node.js version:**
   ```bash
   node -v
   # Should be v18.x or higher
   ```

2. **Clear npm cache:**
   ```bash
   npm cache clean --force
   ```

3. **Try with a fresh node_modules:**
   ```bash
   rm -rf node_modules
   rm package-lock.json
   npm install
   ```

4. **Check for dependency conflicts:**
   ```bash
   npm ls
   # Look for peer dependency warnings
   ```

### Problem: Hot reloading not working

**Symptoms:**
- Changes don't appear without manual refresh
- Console shows compilation errors

**Possible Solutions:**

1. **Check file system watchers:**
   - Some systems have limits on file watchers
   
   ```bash
   # Linux: Increase file watch limit
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

2. **Restart development server with clear cache:**
   ```bash
   # Stop current server and run
   npm run dev -- --clear
   ```

3. **Check for issues in Next.js configuration:**
   ```js
   // next.config.js
   module.exports = {
     reactStrictMode: true,
     // Other settings should be compatible with development mode
   }
   ```

## Getting More Help

If you've tried the solutions in this guide and are still experiencing issues:

1. **Check project logs:**
   - Development server logs
   - Database logs
   - Browser console logs

2. **Search for error messages:**
   - NextAuth.js documentation 
   - Next.js documentation
   - Prisma documentation
   - Stack Overflow

3. **Create a detailed support request:**
   - Include exact error messages
   - List steps to reproduce
   - Describe your environment (Node.js version, database, OS)
   - Share code snippets related to the issue 

## Next.js 15 Specific Issues

### Problem: Route handler type errors with dynamic params

**Symptoms:**
- Build errors with messages like `Type '{ __tag__: "GET"; __param_position__: "second"; __param_type__: { params: { id: string; }; }; }' does not satisfy the constraint 'ParamCheck<RouteContext>'`
- Errors about params missing Promise properties (`then`, `catch`, `finally`)

**Possible Solutions:**

1. **Update route handler parameter types to use Promise-based params:**
   ```typescript
   // Define interface for params
   export interface RouteParams {
     params: Promise<{ id: string }>;
   }
   
   // Use in route handler
   export async function GET(
     request: NextRequest,
     context: RouteParams
   ) {
     try {
       // Await params before accessing
       const resolvedParams = await context.params;
       const { id } = resolvedParams;
       
       // Proceed with request handling
     } catch (error) {
       return NextResponse.json(
         { error: "Failed to process request" },
         { status: 500 }
       );
     }
   }
   ```

2. **Update all dynamic route handlers consistently:**
   - Apply the same Promise-based pattern to all dynamic route handlers
   - Include proper error handling for Promise rejection
   - Consider loading states while params are resolving

3. **Check Next.js version compatibility:**
   - Ensure your code follows latest Next.js 15 patterns
   - Review the Next.js documentation for route handlers 

## TypeScript Errors

### Problem: Type errors in menu management system

**Symptoms:**
- Error: `Variable 'menuItems' implicitly has type 'any[]' in some locations where its type cannot be determined`
- Error: `Property 'error' does not exist on type 'MenuApiResponse'`
- Menu items, categories, or menus don't display in the admin dashboard

**Solution:**

We fixed these issues by properly typing the data structures in `menu-actions.ts`:

1. Added explicit type definitions for API responses:
   ```typescript
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
   ```

2. Properly typed the `menuItems` array to avoid 'any[]' type errors:
   ```typescript
   let menuItems: (MenuItem & { category: { id: string; name: string } })[] = [];
   ```

3. Added type annotations to forEach and map callbacks:
   ```typescript
   data.categories.forEach((category: Category) => {
     // ...
     const itemsWithCategory = category.items.map((item: MenuItem) => ({
       // ...
     }));
   });
   ```

This ensures proper type checking and prevents runtime errors when accessing properties of these objects. 

## Stripe Integration Issues

### Problem: Orders not being created after Stripe payment

**Symptoms:**
- Payment is successful in Stripe
- No order appears in the database
- Webhook is receiving events but not creating orders

**Solution:**

We've enhanced the webhook handler to handle payments regardless of how they're initiated:

1. If a payment contains an `orderId` in the metadata, it updates the existing order
2. If no `orderId` exists, it creates a new order using the payment metadata:
   - Uses the `items` array in metadata to recreate the order
   - Fetches menu items to calculate correct prices
   - Creates a confirmed order with paid status

This makes the system more resilient by handling both payment flows:
- Create order first, then payment (recommended approach)
- Create order from payment data in the webhook (fallback approach)

**Implementation:**
The webhook handler now looks for the following metadata:
- `userId` - Required to associate the order with a user
- `items` - JSON string with menu item IDs and quantities
- `orderType` - PICKUP or DELIVERY
- `pickupTime` - (Optional) When the order should be ready

**Updates:**
- Fixed order number generation in webhook-created orders
- Now generates order numbers in format: `ORD-{timestamp}-{randomChars}`
- Updates existing orders with missing order numbers 