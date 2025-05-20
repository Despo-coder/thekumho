# Database Schema Documentation

This document outlines the database structure for the Restaurant Application, as defined in the Prisma schema.

## Entity Relationship Diagram

Below is a simplified representation of the database relationships:

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  User   │     │  Order  │     │OrderItem│     │MenuItem │
├─────────┤     ├─────────┤     ├─────────┤     ├─────────┤
│ id      │1───*│ id      │1───*│ id      │*───1│ id      │
│ email   │     │ total   │     │ quantity│     │ name    │
│ name    │     │ status  │     │ price   │     │ price   │
│ role    │     │ userId  │─┐   │ menuItemId    │ categoryId
└─────────┘     └─────────┘ │   └─────────┘     └─────────┘
     │1              │1     │                         │1
     │               │      │                         │
     │               │      │                         │
     │*              │*     │1                        │*
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Booking │     │OrderStat│     │ Review  │     │Category │
├─────────┤     ├─────────┤     ├─────────┤     ├─────────┤
│ id      │     │ id      │     │ id      │     │ id      │
│ tableId │     │ status  │     │ rating  │     │ name    │
│ userId  │─────│ orderId │     │ content │     │description
└─────────┘     └─────────┘     └─────────┘     └─────────┘
     │*              │*                              │1
     │               │                               │
     │1              │                               │
┌─────────┐     ┌─────────┐                     ┌─────────┐
│  Table  │     │  Sale   │                     │  Menu   │
├─────────┤     ├─────────┤                     ├─────────┤
│ id      │     │ id      │                     │ id      │
│ seats   │     │ total   │                     │ name    │
│ location│     │ orderId │                     │ isActive│
└─────────┘     └─────────┘                     └─────────┘
                     │1
┌─────────┐          │
│ Waitlist│          │
├─────────┤          │
│ id      │          │
│ status  │──────────┘
│ userId  │
└─────────┘
```

## Tables

### User

Stores information about users, including customers and staff.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String? | User's full name |
| email | String | Unique email address |
| emailVerified | DateTime? | When email was verified |
| image | String? | Profile image URL |
| password | String? | Hashed password |
| role | Role (enum) | USER, ADMIN, CHEF, WAITER, MANAGER |
| phone | String? | Phone number |
| isActive | Boolean | Account active status |
| lastLogin | DateTime? | Last login timestamp |
| createdAt | DateTime | Account creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Table

Represents physical tables in the restaurant.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| tableNumber | Int | Unique table number |
| seats | Int | Number of seats |
| location | String? | Table location description |

### Booking

Stores table reservations.

| Field | Type | Description |
|-------|------|-------------|
| id | Int | Primary key |
| customerName | String | Name of the customer |
| email | String? | Customer email |
| phone | String? | Customer phone number |
| partySize | Int | Number of people |
| bookingTime | DateTime | Reservation date/time |
| specialRequest | String? | Special requests/notes |
| status | String | pending, confirmed, cancelled, etc. |
| createdAt | DateTime | Booking creation timestamp |
| tableId | Int? | References Table |
| userId | String? | References User |

### Menu

Represents different menus the restaurant may have.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Menu name |
| description | String? | Menu description |
| isActive | Boolean | Whether menu is currently active |
| isPickup | Boolean | Whether menu is available for pickup |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Category

Represents menu categories (e.g., Appetizers, Main Courses).

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Category name (unique) |
| description | String? | Category description |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### MenuItem

Represents individual items on the menu.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Item name |
| description | String? | Item description |
| price | Decimal | Item price |
| image | String? | Image URL |
| isAvailable | Boolean | Item availability |
| isVegetarian | Boolean | Vegetarian flag |
| isVegan | Boolean | Vegan flag |
| isPescatarian | Boolean | Pescatarian flag |
| isGlutenFree | Boolean | Gluten-free flag |
| isDairyFree | Boolean | Dairy-free flag |
| isNutFree | Boolean | Nut-free flag |
| isSpicy | Boolean | Spicy flag |
| menuId | String | References Menu |
| categoryId | String | References Category |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### DietaryTag

Represents dietary preferences/restrictions.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| name | String | Tag name (unique) |
| description | String? | Tag description |
| color | String? | Color for UI display |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Order

Represents customer orders.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| orderNumber | String? | Customer-facing order number |
| total | Decimal | Order total |
| status | OrderStatus (enum) | PENDING, CONFIRMED, PREPARING, etc. |
| paymentStatus | PaymentStatus (enum) | PENDING, PAID, FAILED, REFUNDED |
| paymentMethod | String? | Payment method |
| orderType | OrderType (enum) | DINE_IN, PICKUP |
| isNotified | Boolean | Staff notification status |
| orderNotes | String? | General order notes |
| estimatedPickupTime | DateTime? | Estimated pickup time |
| completedTime | DateTime? | Order completion time |
| userId | String | References User |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### OrderItem

Represents individual items within an order.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| quantity | Int | Item quantity |
| price | Decimal | Item price (at time of order) |
| specialInstructions | String? | Special instructions for this item |
| menuItemId | String | References MenuItem |
| orderId | String | References Order |

### OrderStatusUpdate

Tracks status changes for orders.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| status | OrderStatus (enum) | New status |
| note | String? | Note about status change |
| orderId | String | References Order |
| updatedById | String | References User who made update |
| createdAt | DateTime | Update timestamp |

### Notification

Stores system notifications.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| type | NotificationType (enum) | Notification type |
| message | String | Notification message |
| isRead | Boolean | Read status |
| userId | String | References User |
| relatedOrderId | String? | References Order if applicable |
| createdAt | DateTime | Creation timestamp |

### Review

Stores customer reviews for menu items.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| rating | Int | Rating (1-5) |
| title | String? | Review title |
| content | String | Review content |
| userId | String | References User |
| menuItemId | String | References MenuItem |
| isVerified | Boolean | Verification status |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Sale

Tracks financial transactions and sales records.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| saleNumber | String? | Customer-facing receipt number |
| subtotal | Decimal | Sale subtotal before tax |
| tax | Decimal | Tax amount |
| tip | Decimal? | Tip amount if applicable |
| discount | Decimal? | Discount amount if applicable |
| total | Decimal | Total sale amount |
| paymentMethod | String | Payment method (Credit, Cash, etc.) |
| paymentStatus | PaymentStatus (enum) | Payment status |
| orderId | String? | References Order if associated |
| serverId | String? | References User (waiter) |
| processedById | String | References User who processed |
| notes | String? | Additional notes |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

### Waitlist

Manages customers waiting when reservations are unavailable.

| Field | Type | Description |
|-------|------|-------------|
| id | String (cuid) | Primary key |
| customerName | String | Customer name |
| phoneNumber | String | Contact phone number |
| email | String? | Contact email |
| partySize | Int | Size of party |
| requestedDate | DateTime | Requested date |
| requestedTime | DateTime | Requested time |
| estimatedWait | Int? | Estimated wait in minutes |
| status | WaitlistStatus (enum) | Current status |
| notificationSent | Boolean | If notification was sent |
| userId | String? | References User if registered |
| notes | String? | Additional notes |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

## Enums

### Role
- USER: Regular customer
- ADMIN: Administrative user with full access
- CHEF: Kitchen staff
- WAITER: Front of house staff
- MANAGER: Restaurant manager

### OrderStatus
- PENDING: Initial order state
- CONFIRMED: Order confirmed but not started
- PREPARING: Order being prepared
- READY_FOR_PICKUP: Order ready for pickup
- COMPLETED: Order completed
- CANCELED: Order canceled
- REFUNDED: Order refunded

### PaymentStatus
- PENDING: Payment not yet processed
- PAID: Payment successful
- FAILED: Payment failed
- REFUNDED: Payment refunded

### OrderType
- DINE_IN: Order for in-restaurant dining
- PICKUP: Order for pickup

### NotificationType
- NEW_ORDER: Notification for new orders
- ORDER_STATUS_CHANGE: Notification for order status changes
- ORDER_ASSIGNED: Notification for order assignments
- PAYMENT_RECEIVED: Notification for payments
- REVIEW_RECEIVED: Notification for new reviews
- SYSTEM_ALERT: System alerts

### WaitlistStatus
- WAITING: Customer is on waitlist
- NOTIFIED: Customer has been notified of availability
- SEATED: Customer has been seated
- CANCELLED: Customer cancelled request
- NO_SHOW: Customer did not show up 