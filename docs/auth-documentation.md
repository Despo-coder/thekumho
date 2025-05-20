# Authentication & Authorization

This document outlines the authentication and authorization system used in the Restaurant Application.

## Authentication System

The application uses [NextAuth.js](https://next-auth.js.org/) for authentication, which provides a complete authentication solution with the following features:

- Secure, JWT-based authentication
- Session management
- CSRF protection
- Secure cookie handling

### Authentication Flow

1. **User Registration**:
   - Users register through the `/register` page
   - Email and password are validated
   - Password is hashed using bcrypt
   - User record is created in the database

2. **User Login**:
   - Users login through the `/login` page
   - Credentials are validated against the database
   - If successful, a JWT token is generated and stored in cookies
   - User is redirected to the appropriate page based on their role

3. **Session Management**:
   - Sessions are managed using JWT tokens
   - Session token is stored in an HTTP-only cookie
   - Session includes user ID, email, name, and role
   - Sessions expire after the configured time period

4. **Logout**:
   - Clicking logout invalidates the session
   - Cookies are cleared
   - User is redirected to the home page

## User Roles and Permissions

The application implements role-based access control (RBAC) with the following roles:

### User Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| USER | Regular customer | Low |
| WAITER | Front-of-house staff | Medium |
| CHEF | Kitchen staff | Medium |
| MANAGER | Restaurant manager | High |
| ADMIN | System administrator | Full |

### Role Permissions

#### USER
- Browse the menu
- Create and manage their own account
- Place orders
- Make reservations
- View their order history
- Submit reviews for menu items
- Update their profile information

#### WAITER
- All USER permissions
- Access to staff dashboard
- View all current orders
- Update order status (CONFIRMED, COMPLETED)
- View all reservations
- Manage table assignments

#### CHEF
- All USER permissions
- Access to staff dashboard
- View all current orders
- Update order status (PREPARING, READY_FOR_PICKUP)
- View menu items

#### MANAGER
- All WAITER and CHEF permissions
- Manage menu items (create, update, delete)
- Manage categories
- View sales reports
- Handle customer issues (refunds, cancellations)
- Manage staff accounts

#### ADMIN
- Full system access
- User management (create, update, delete)
- System configuration
- Access to all data and functions

## Protected Routes

The application implements route protection to ensure users can only access pages they have permission for:

### Public Routes (No Authentication Required)
- Home page (`/`)
- Menu page (`/menu`)
- Login page (`/login`)
- Registration page (`/register`)

### Protected Routes (Authentication Required)

#### User Routes
- Profile page (`/profile`)
- Orders page (`/orders`)
- Reservation management (`/reservations`)

#### Staff Routes (WAITER, CHEF, MANAGER, ADMIN)
- Admin dashboard (`/admin`)
- Kitchen view (`/admin/kitchen`)
- Reservations management (`/admin/reservations`)

#### Admin-Only Routes
- User management (`/admin/users`)
- System settings (`/admin/settings`)

## Implementation Details

### Middleware

Route protection is implemented using Next.js middleware:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const session = getToken({ req: request });

  // Check if user is trying to access a protected route without authentication
  if (!session && isProtectedRoute(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check if user is trying to access admin routes without proper role
  if (session && 
      isAdminRoute(request.nextUrl.pathname) && 
      !hasAdminRole(session)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}
```

### Auth Provider Setup

Authentication is set up using NextAuth.js:

```typescript
// app/api/auth/[...nextauth]/options.ts
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validation logic here
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    // Add role to token and session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as User).role;
      }
      return token;
    }
  }
};
```

The route handler imports and uses the authOptions:

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "./options";

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
```

For reusing authOptions in other parts of the application:

```typescript
// app/api/auth/auth.ts
import { authOptions } from "./[...nextauth]/options";

export { authOptions };
```

### Client-Side Authentication

Client components can access the authentication state using the `useSession` hook:

```tsx
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (status === "unauthenticated") {
    return <p>Access Denied</p>;
  }

  return (
    <div>
      <h1>Profile</h1>
      <p>Welcome {session.user.name}</p>
      <p>Role: {session.user.role}</p>
    </div>
  );
}
```

### Server-Side Authentication

Server components can access the authentication state using `getServerSession`:

```tsx
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/auth";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return new Response(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
    });
  }

  // Proceed with authorized request handling
}
```

## Security Considerations

The authentication system implements the following security best practices:

- Passwords are hashed using bcrypt with appropriate salt rounds
- JWT tokens are stored in HTTP-only cookies to prevent XSS attacks
- CSRF protection is implemented
- Sessions expire after a reasonable time period
- Role-based access control prevents unauthorized access
- Failed login attempts are rate-limited to prevent brute force attacks
- Sensitive operations require re-authentication 