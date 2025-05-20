# Feature Documentation

This document outlines the main features of the Restaurant Application and how they work.

## 1. Authentication System

### Overview

The authentication system manages user accounts, login/logout functionality, and role-based access control. It's built using NextAuth.js for secure user authentication.

### Implementation Details

- **User Registration**: Allows customers to create accounts with email and password
- **Login**: Authenticates users using credentials provider
- **Session Management**: Uses JWT for maintaining user sessions
- **Role-Based Access Control**: Restricts access to different parts of the application based on user roles (USER, CHEF, WAITER, ADMIN)

### User Experience

1. New users can register via the `/register` page
2. Existing users can log in via the `/login` page
3. After authentication, users are redirected based on their role (regular users to home, staff to admin dashboard)
4. Session information is maintained across page navigation
5. Protected routes require authentication or specific roles to access

## 2. Menu System

### Overview

The menu system displays restaurant menu items organized by categories, with filtering capabilities for dietary preferences.

### Implementation Details

- **Menu Categories**: Items grouped by categories (appetizers, main courses, desserts, etc.)
- **Dietary Preferences**: Filters for vegetarian, vegan, gluten-free, etc.
- **Dynamic Display**: Server-side fetching of menu data from the database
- **Search Capability**: Allows users to search for menu items

### User Experience

1. Users can browse the full menu on the `/menu` page
2. Items are grouped by categories with visual separation
3. Users can filter items by dietary preferences using filter buttons
4. Each menu item shows:
   - Name and price
   - Description
   - Dietary information (vegetarian, vegan, gluten-free, etc.)
   - Image (if available)
5. Users can click on items for more details or to add to their order

## 3. Reservation System

### Overview

The reservation system allows customers to book tables for specific dates and times.

### Implementation Details

- **Availability Checking**: Checks table availability for the requested time
- **Table Assignment**: Automatic assignment of appropriate tables based on party size
- **Reservation Management**: Staff interface for viewing and managing reservations
- **Status Tracking**: Tracks reservation status (pending, confirmed, canceled)

### User Experience

#### Customer Flow
1. Customer navigates to the `/reservation` page
2. Fills out the reservation form with:
   - Name, email, and phone
   - Party size
   - Desired date and time
   - Special requests (optional)
3. System checks availability and confirms the reservation
4. Customer receives a confirmation message
5. Reservations are stored in the customer's account if logged in

#### Staff Flow
1. Staff can view all upcoming reservations in the admin dashboard
2. Reservations can be filtered by date, status, or customer name
3. Staff can update reservation status (confirm, cancel, mark as complete)
4. Staff can add notes to reservations

## 4. Order System

### Overview

The order system allows customers to place food orders for pickup, tracks order status, and allows staff to manage orders.

### Implementation Details

- **Shopping Cart**: Allows users to add multiple items
- **Checkout Process**: Collects order details and payment information
- **Order Tracking**: Keeps customers informed about their order status
- **Staff Interface**: Dashboard for staff to manage and update orders

### User Experience

#### Customer Flow
1. Customer browses the menu and adds items to their cart
2. Cart shows selected items, quantities, and total price
3. Customer proceeds to checkout
4. System collects necessary information:
   - Pickup time
   - Special instructions
   - Payment details
5. Customer receives order confirmation
6. Customer can track order status on the `/orders` page

#### Staff Flow
1. New orders appear in the admin dashboard
2. Kitchen staff can update order status as it progresses
3. Staff can view order details and customer information
4. Completed orders are archived but remain accessible for reference

## 5. Admin Dashboard

### Overview

The admin dashboard provides staff with tools to manage all aspects of the restaurant's operations.

### Implementation Details

- **Overview Panel**: Shows key metrics and statistics
- **Order Management**: Interface for viewing and updating orders
- **Reservation Management**: Tools for managing table bookings
- **Menu Management**: CRUD operations for menu items and categories
- **User Management**: Admin tools for managing user accounts
- **Role-Based Access**: Different views and permissions based on staff role

### User Experience

1. Staff members log in with their credentials
2. Dashboard displays appropriate tools based on staff role
3. Tabs provide access to different management areas:
   - Overview
   - Orders
   - Reservations
   - Menu (for managers/admins)
   - Users (for admins only)
4. Each section provides:
   - Data visualization
   - List views
   - Detailed views
   - Edit/update capabilities
   - Search and filtering

#### Overview Tab
- Displays statistics such as daily orders, upcoming reservations, and popular menu items
- Shows notifications for new orders, reservations, or issues

#### Orders Tab
- Lists current orders with status indicators
- Allows staff to update order status
- Provides detailed view of order contents
- Includes search and filtering capabilities

#### Reservations Tab
- Calendar view of upcoming reservations
- List view with sorting and filtering
- Ability to create, modify, or cancel reservations
- Table assignment management

#### Menu Tab (for managers/admins)
- CRUD operations for menu items
- Category management
- Dietary tag management
- Menu availability controls

#### Users Tab (for admins only)
- User account management
- Role assignment
- Account status control

## 6. Review System

### Overview

The review system allows customers to rate and review menu items, providing feedback for both the restaurant and other customers.

### Implementation Details

- **Rating System**: Star ratings (1-5) for menu items
- **Review Comments**: Text feedback from customers
- **Moderation**: Admin review and approval of submissions
- **Display**: Shows average ratings and selected reviews on menu items

### User Experience

1. Authenticated users can submit reviews for menu items they've ordered
2. Review form includes:
   - Star rating
   - Review title
   - Detailed comments
3. Reviews appear on menu item pages after moderation
4. Average ratings are displayed prominently on menu items
5. Admins can moderate reviews through the admin dashboard

## 7. Notification System

### Overview

The notification system keeps users and staff informed about important events such as order status changes, new reservations, and system alerts.

### Implementation Details

- **User Notifications**: Alerts for customers about their orders and reservations
- **Staff Notifications**: Alerts for new orders, reservations, and issues
- **Notification Types**: Different types of notifications with appropriate styling
- **Read Status**: Tracking of read/unread notifications

### User Experience

#### Customer Notifications
- Order status updates
- Reservation confirmations
- Special offers or events

#### Staff Notifications
- New order alerts
- Upcoming reservation reminders
- System issues or alerts
- Customer feedback

## 8. API System

### Overview

The API system provides structured endpoints for client-server communication, handling data operations, and integrating with external services.

### Implementation Details

- **RESTful Endpoints**: Structured API for all data operations
- **Authentication**: Protected routes with role-based access
- **Validation**: Input validation and error handling
- **Response Formatting**: Consistent JSON response structure

### API Structure

The API follows a consistent pattern with endpoints organized by resource:

- `/api/auth/[...nextauth]`: Authentication endpoints
- `/api/menu`: Menu item operations
- `/api/bookings`: Reservation operations
- `/api/orders`: Order operations
- `/api/reviews`: Review operations
- `/api/users`: User management (admin only)

Each endpoint implements appropriate HTTP methods (GET, POST, PUT, DELETE) with proper status codes and error handling. 