# API Documentation

This document outlines all the API endpoints available in the Restaurant Application.

## Authentication Endpoints

### NextAuth Endpoints

The authentication system uses NextAuth.js, which provides the following endpoints:

#### `POST /api/auth/signin`
- Initiates the sign-in process
- Parameters: `email`, `password`
- Returns: JWT session token

#### `POST /api/auth/signout`
- Signs out the current user
- Returns: Success message

#### `GET /api/auth/session`
- Retrieves the current session data
- Returns: Session information if authenticated

#### `GET /api/auth/csrf`
- Retrieves a CSRF token for form submission
- Returns: CSRF token

### Registration Endpoint

#### `POST /api/register`
- Creates a new user account
- Parameters:
  - `name`: User's full name
  - `email`: User's email address
  - `password`: User's password
  - `phone` (optional): User's phone number
- Returns: Created user object (without password)
- Status codes:
  - 201: User created successfully
  - 400: Invalid input
  - 409: Email already in use
  - 500: Server error

## Booking Endpoints

### `GET /api/bookings`
- Fetches bookings
- Query Parameters:
  - `userId` (optional): Filter bookings by user ID
- Authentication: Required
- Authorization: Users can only access their own bookings, admins can access all
- Returns: Array of booking objects
- Status codes:
  - 200: Success
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Server error

### `POST /api/bookings`
- Creates a new booking
- Parameters:
  - `customerName`: Name of the customer
  - `email`: Customer's email
  - `phone`: Customer's phone number
  - `partySize`: Number of people
  - `bookingTime`: Date and time of the booking
  - `specialRequest` (optional): Special requests or notes
  - `userId` (optional): ID of the authenticated user
- Authentication: Optional
- Returns: Created booking object
- Status codes:
  - 201: Booking created successfully
  - 400: Invalid input or no tables available
  - 500: Server error

## Order Endpoints

### `GET /api/orders`
- Fetches orders
- Query Parameters:
  - `userId` (optional): Filter orders by user ID
- Authentication: Required
- Authorization: Users can only access their own orders, staff can access all
- Returns: Array of order objects with items
- Status codes:
  - 200: Success
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Server error

### `POST /api/orders`
- Creates a new order
- Parameters:
  - `items`: Array of order items with menuItemId, quantity, and specialInstructions
  - `specialInstructions` (optional): Special instructions for the order
  - `orderType`: Type of order (PICKUP or DINE_IN)
- Authentication: Required
- Returns: Created order object
- Status codes:
  - 201: Order created successfully
  - 400: Invalid input
  - 401: Unauthorized
  - 500: Server error

## Menu Endpoints

### `GET /api/menu`
- Fetches menu items
- Query Parameters:
  - `category` (optional): Filter by category
  - `dietary` (optional): Filter by dietary preferences
  - `search` (optional): Search term for menu items
- Authentication: Not required
- Returns: Array of menu items
- Status codes:
  - 200: Success
  - 500: Server error

### `POST /api/menu` (Admin only)
- Creates a new menu item
- Parameters:
  - `name`: Item name
  - `description`: Item description
  - `price`: Item price
  - `categoryId`: Category ID
  - `image` (optional): Image URL
  - `isVegetarian`, `isVegan`, `isGlutenFree`, etc.: Dietary flags
- Authentication: Required
- Authorization: Admin only
- Returns: Created menu item
- Status codes:
  - 201: Item created successfully
  - 400: Invalid input
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Server error

### `PUT /api/menu/:id` (Admin only)
- Updates an existing menu item
- URL Parameters:
  - `id`: Menu item ID
- Body Parameters: Same as POST endpoint
- Authentication: Required
- Authorization: Admin only
- Returns: Updated menu item
- Status codes:
  - 200: Item updated successfully
  - 400: Invalid input
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Item not found
  - 500: Server error

### `DELETE /api/menu/:id` (Admin only)
- Deletes a menu item
- URL Parameters:
  - `id`: Menu item ID
- Authentication: Required
- Authorization: Admin only
- Returns: Success message
- Status codes:
  - 200: Item deleted successfully
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Item not found
  - 500: Server error

## Review Endpoints

### `GET /api/reviews`
- Fetches reviews
- Query Parameters:
  - `menuItemId` (optional): Filter by menu item
  - `userId` (optional): Filter by user
- Authentication: Not required
- Returns: Array of reviews
- Status codes:
  - 200: Success
  - 500: Server error

### `POST /api/reviews`
- Creates a new review
- Parameters:
  - `menuItemId`: ID of the menu item
  - `rating`: Rating (1-5)
  - `title` (optional): Review title
  - `content`: Review content
- Authentication: Required
- Returns: Created review
- Status codes:
  - 201: Review created successfully
  - 400: Invalid input
  - 401: Unauthorized
  - 500: Server error

## User Endpoints (Admin only)

### `GET /api/users`
- Fetches users
- Authentication: Required
- Authorization: Admin only
- Returns: Array of users (without passwords)
- Status codes:
  - 200: Success
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Server error

### `PUT /api/users/:id`
- Updates a user
- URL Parameters:
  - `id`: User ID
- Body Parameters:
  - `name` (optional): User's name
  - `email` (optional): User's email
  - `role` (optional): User's role
  - `isActive` (optional): User's active status
- Authentication: Required
- Authorization: Admin only
- Returns: Updated user
- Status codes:
  - 200: User updated successfully
  - 400: Invalid input
  - 401: Unauthorized
  - 403: Forbidden
  - 404: User not found
  - 500: Server error

## Error Handling

All API endpoints follow a common error response format:

```json
{
  "message": "Error message describing what went wrong"
}
```

Status codes are used appropriately to indicate the type of error:
- 400: Bad Request - Invalid input or parameters
- 401: Unauthorized - Authentication required
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource not found
- 409: Conflict - Resource already exists
- 500: Internal Server Error - Unexpected server error 