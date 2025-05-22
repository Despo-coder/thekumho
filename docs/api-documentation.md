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

### Get Order By ID
- **URL**: `/api/orders/{id}`
- **Method**: `GET`
- **Auth Required**: Yes
- **Description**: Retrieves an order by its ID
- **Response**: Order details including items, status, and payment information

### Get Order By Payment Intent
- **URL**: `/api/orders/by-payment`
- **Method**: `GET`
- **Auth Required**: Yes
- **Query Parameters**:
  - `paymentIntentId` (required): The Stripe Payment Intent ID
- **Description**: Retrieves an order by its associated Stripe payment intent ID
- **Response**: 
  ```json
  {
    "success": true,
    "order": {
      "id": "order_id",
      "orderNumber": "ORD-123456-ABCD",
      "total": 24.99,
      "status": "CONFIRMED",
      "pickupTime": "4:30 PM, May 21, 2025",
      "items": [
        {
          "name": "Item Name",
          "quantity": 2,
          "price": 9.99,
          "image": "image_url"
        }
      ]
    }
  }
  ```
- **Errors**:
  - `401 Unauthorized`: If user is not authenticated
  - `400 Bad Request`: If payment intent ID is missing
  - `404 Not Found`: If no order is found for the payment intent ID

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

### `GET /api/menu/:id`
- Fetches a specific menu item by ID with full details
- URL Parameters:
  - `id`: Menu item ID
- Authentication: Not required
- Returns: Menu item object with category, menu, and reviews
- Status codes:
  - 200: Success
  - 404: Item not found
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

## Promotion Endpoints

### `GET /api/promotions`
- Fetches all promotions
- Query Parameters:
  - `active` (optional): Filter active promotions only (boolean)
  - `current` (optional): Filter promotions valid for current date (boolean)
  - `couponCode` (optional): Find promotion by coupon code
- Authentication: Not required for public promotions, Admin for all
- Returns: Array of promotion objects
- Status codes:
  - 200: Success
  - 500: Server error

### `GET /api/promotions/:id`
- Fetches a specific promotion by ID
- URL Parameters:
  - `id`: Promotion ID
- Authentication: Admin only
- Returns: Promotion object with related items and categories
- Status codes:
  - 200: Success
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Promotion not found
  - 500: Server error

### `POST /api/promotions` (Admin only)
- Creates a new promotion
- Parameters:
  - `name`: Promotion name
  - `description` (optional): Promotion description
  - `promotionType`: Type of promotion (PERCENTAGE_DISCOUNT, FIXED_AMOUNT_DISCOUNT, FREE_ITEM, BUY_ONE_GET_ONE)
  - `value`: Percentage or amount value
  - `minimumOrderValue` (optional): Minimum order value for eligibility
  - `startDate`: Start date for the promotion
  - `endDate`: End date for the promotion
  - `isActive`: Activation status
  - `freeItemId` (optional): ID of free item for FREE_ITEM promotions
  - `couponCode` (optional): Coupon code to apply promotion
  - `usageLimit` (optional): Maximum usage limit
  - `applyToAllItems`: Whether to apply to all items
  - `menuItemIds` (optional): Array of menu item IDs
  - `categoryIds` (optional): Array of category IDs
- Authentication: Required
- Authorization: Admin only
- Returns: Created promotion
- Status codes:
  - 201: Promotion created successfully
  - 400: Invalid input
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Server error

### `PUT /api/promotions/:id` (Admin only)
- Updates an existing promotion
- URL Parameters:
  - `id`: Promotion ID
- Body Parameters: Same as POST endpoint
- Authentication: Required
- Authorization: Admin only
- Returns: Updated promotion
- Status codes:
  - 200: Promotion updated successfully
  - 400: Invalid input
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Promotion not found
  - 500: Server error

### `DELETE /api/promotions/:id` (Admin only)
- Deletes a promotion
- URL Parameters:
  - `id`: Promotion ID
- Authentication: Required
- Authorization: Admin only
- Returns: Success message
- Status codes:
  - 200: Promotion deleted successfully
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Promotion not found
  - 500: Server error

### `POST /api/promotions/validate`
- Validates a coupon code and calculates discount
- Parameters:
  - `code`: Coupon code to validate
  - `cartItems`: Array of cart items with menuItemId, quantity, and price
  - `cartTotal`: Total cart amount
- Authentication: Not required
- Returns: Promotion details and calculated discount
- Status codes:
  - 200: Valid promotion with discount details
  - 400: Invalid or expired coupon code
  - 404: Coupon code not found
  - 500: Server error

## Category Endpoints

### `GET /api/categories`
- Fetches all menu categories
- Authentication: Not required
- Returns: Array of category objects
- Status codes:
  - 200: Success
  - 500: Server error

### `POST /api/categories` (Admin only)
- Creates a new menu category
- Parameters:
  - `name`: Category name
  - `description` (optional): Category description
- Authentication: Required
- Authorization: Admin only
- Returns: Created category
- Status codes:
  - 201: Category created successfully
  - 400: Invalid input
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Server error

### `PUT /api/categories/:id` (Admin only)
- Updates an existing category
- URL Parameters:
  - `id`: Category ID
- Body Parameters:
  - `name`: Category name
  - `description` (optional): Category description
- Authentication: Required
- Authorization: Admin only
- Returns: Updated category
- Status codes:
  - 200: Category updated successfully
  - 400: Invalid input
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Category not found
  - 500: Server error

### `DELETE /api/categories/:id` (Admin only)
- Deletes a category
- URL Parameters:
  - `id`: Category ID
- Authentication: Required
- Authorization: Admin only
- Returns: Success message
- Status codes:
  - 200: Category deleted successfully
  - 400: Cannot delete category with items
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Category not found
  - 500: Server error

## Menu Endpoints (Menus collection)

### `GET /api/menu/menus`
- Fetches all menus
- Query Parameters:
  - `includeCount` (optional): Include item count in response
- Authentication: Not required
- Returns: Array of menu objects
- Status codes:
  - 200: Success
  - 500: Server error

### `POST /api/menu/menus` (Admin only)
- Creates a new menu
- Parameters:
  - `name`: Menu name
  - `description` (optional): Menu description
  - `isActive`: Whether the menu is active
  - `isPickup`: Whether the menu is available for pickup
- Authentication: Required
- Authorization: Admin only
- Returns: Created menu
- Status codes:
  - 201: Menu created successfully
  - 400: Invalid input
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Server error

### `PUT /api/menu/menus/:id` (Admin only)
- Updates an existing menu
- URL Parameters:
  - `id`: Menu ID
- Body Parameters:
  - `name`: Menu name
  - `description` (optional): Menu description
  - `isActive`: Whether the menu is active
  - `isPickup`: Whether the menu is available for pickup
- Authentication: Required
- Authorization: Admin only
- Returns: Updated menu
- Status codes:
  - 200: Menu updated successfully
  - 400: Invalid input
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Menu not found
  - 500: Server error

### `DELETE /api/menu/menus/:id` (Admin only)
- Deletes a menu
- URL Parameters:
  - `id`: Menu ID
- Authentication: Required
- Authorization: Admin only
- Returns: Success message
- Status codes:
  - 200: Menu deleted successfully
  - 400: Cannot delete menu with items
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Menu not found
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

## Waitlist Endpoints

### `GET /api/waitlist`
- Fetches all waitlist entries
- Query Parameters:
  - `status` (optional): Filter by status (WAITING, NOTIFIED, SEATED, CANCELLED, NO_SHOW)
  - `date` (optional): Filter by date
- Authentication: Required
- Authorization: Staff only (ADMIN, MANAGER, WAITER)
- Returns: Array of waitlist entries
- Status codes:
  - 200: Success
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Server error

### `POST /api/waitlist`
- Creates a new waitlist entry
- Parameters:
  - `customerName`: Name of the customer
  - `phoneNumber`: Phone number of the customer
  - `partySize`: Number of people in the party
  - `requestedDate`: Requested date
  - `requestedTime`: Requested time
  - `email` (optional): Customer's email
  - `estimatedWait` (optional): Estimated wait time in minutes
  - `notes` (optional): Additional notes
- Authentication: Optional (if user is logged in, their ID is linked to the entry)
- Returns: Created waitlist entry
- Status codes:
  - 201: Waitlist entry created successfully
  - 400: Invalid input
  - 500: Server error

### `GET /api/waitlist/:id`
- Fetches a specific waitlist entry
- URL Parameters:
  - `id`: Waitlist entry ID
- Authentication: Required
- Authorization: Staff or the customer who created the entry
- Returns: Waitlist entry details
- Status codes:
  - 200: Success
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Waitlist entry not found
  - 500: Server error

### `PATCH /api/waitlist/:id`
- Updates a waitlist entry
- URL Parameters:
  - `id`: Waitlist entry ID
- Body Parameters:
  - `status` (optional): New status
  - `estimatedWait` (optional): Updated wait time
  - `notificationSent` (optional): Whether notification has been sent
  - `notes` (optional): Updated notes
- Authentication: Required
- Authorization: Staff only (ADMIN, MANAGER, WAITER)
- Returns: Updated waitlist entry
- Status codes:
  - 200: Waitlist entry updated successfully
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Waitlist entry not found
  - 500: Server error

### `DELETE /api/waitlist/:id`
- Deletes a waitlist entry
- URL Parameters:
  - `id`: Waitlist entry ID
- Authentication: Required
- Authorization: Staff or the customer who created the entry
- Returns: Success message
- Status codes:
  - 200: Waitlist entry deleted successfully
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Waitlist entry not found
  - 500: Server error

## Sales Endpoints

### `GET /api/sales`
- Fetches all sales records
- Query Parameters:
  - `startDate` (optional): Filter by start date
  - `endDate` (optional): Filter by end date
  - `serverId` (optional): Filter by server/waiter ID
  - `paymentMethod` (optional): Filter by payment method
- Authentication: Required
- Authorization: Staff only (ADMIN, MANAGER, WAITER)
- Returns: Array of sales records
- Status codes:
  - 200: Success
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Server error

### `POST /api/sales`
- Creates a new sales record
- Parameters:
  - `subtotal`: Subtotal amount
  - `tax`: Tax amount
  - `total`: Total amount
  - `paymentMethod`: Method of payment
  - `tip` (optional): Tip amount
  - `discount` (optional): Discount amount
  - `orderId` (optional): Related order ID
  - `serverId` (optional): Server/waiter ID
  - `notes` (optional): Additional notes
- Authentication: Required
- Authorization: Staff only (ADMIN, MANAGER, WAITER)
- Returns: Created sales record
- Status codes:
  - 201: Sales record created successfully
  - 400: Invalid input
  - 401: Unauthorized
  - 403: Forbidden
  - 500: Server error

### `GET /api/sales/:id`
- Fetches a specific sales record
- URL Parameters:
  - `id`: Sales record ID
- Authentication: Required
- Authorization: Staff only (ADMIN, MANAGER, WAITER)
- Returns: Sales record details
- Status codes:
  - 200: Success
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Sales record not found
  - 500: Server error

### `PATCH /api/sales/:id`
- Updates a sales record
- URL Parameters:
  - `id`: Sales record ID
- Body Parameters:
  - `tip` (optional): Updated tip amount
  - `discount` (optional): Updated discount amount
  - `notes` (optional): Updated notes
- Authentication: Required
- Authorization: Admin only
- Returns: Updated sales record
- Status codes:
  - 200: Sales record updated successfully
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Sales record not found
  - 500: Server error

### `DELETE /api/sales/:id`
- Voids a sales record (marks as refunded)
- URL Parameters:
  - `id`: Sales record ID
- Authentication: Required
- Authorization: Admin only
- Returns: Voided sales record
- Status codes:
  - 200: Sales record voided successfully
  - 401: Unauthorized
  - 403: Forbidden
  - 404: Sales record not found
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