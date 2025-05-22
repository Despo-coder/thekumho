# Testing Instructions

This document outlines how to test the Restaurant Application to ensure all features are working as expected.

## Local Testing Setup

Before running tests, ensure your development environment is set up properly:

1. **Database**: Make sure your local database is running and properly seeded
   ```bash
   npx prisma db push
   npm run prisma:seed
   ```

2. **Environment Variables**: Verify your `.env` file has the necessary variables:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/restaurant_db"
   NEXTAUTH_SECRET="your-dev-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

3. **Dependencies**: Ensure all dependencies are installed
   ```bash
   npm install
   ```

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```

## Manual Testing Checklist

### Authentication Testing

#### Registration Testing
1. Navigate to `/register`
2. Fill out the registration form with test data
3. Submit and verify that:
   - Success message appears
   - You're redirected to the login page
4. Try to register with an existing email and verify error message

#### Login Testing
1. Navigate to `/login`
2. Login with test credentials:
   - Admin user: `admin@restaurant.com` / `Admin123!`
   - Regular user: `customer@example.com` / `User123!`
3. Verify that:
   - Login is successful
   - Session is created (check browser cookies)
   - UI updates to show logged-in state
   - Redirect behavior is correct based on role

#### Role Access Testing
1. Login as admin and verify access to `/admin`
2. Login as regular user and verify you cannot access `/admin`
3. Test all protected routes for proper authorization

### Menu Testing

1. Navigate to `/menu`
2. Verify menu items are displayed correctly
3. Test dietary filters:
   - Click on "Vegetarian" and verify only vegetarian items are shown
   - Click on "Vegan" and verify only vegan items are shown
   - Test other filters
4. Test category display:
   - Verify items are grouped by category
   - Verify category headings are displayed

### Reservation Testing

1. Navigate to `/reservation`
2. Test form validation:
   - Try submitting without required fields
   - Check date/time validation
   - Verify party size constraints
3. Submit a valid reservation and verify:
   - Success message is displayed
   - Reservation is stored in the database
4. As staff, check admin dashboard to see the new reservation

### Order Testing

1. Test adding items to cart:
   - Add various menu items to cart
   - Modify quantities
   - Remove items
2. Test checkout process:
   - Fill out checkout form
   - Select payment method
   - Submit order
3. Verify order confirmation:
   - Check order details are correct
   - Verify order appears in user's order history
4. As staff, verify order appears in admin dashboard

### Admin Dashboard Testing

Login as admin (`admin@restaurant.com` / `Admin123!`) and test:

#### Overview Tab
1. Verify statistics are displayed correctly
2. Check that data refresh works if implemented

#### Orders Tab
1. View all orders
2. Test filtering and search functionality
3. Update order status and verify changes persist
4. View order details

#### Reservations Tab
1. View all reservations
2. Test filtering by date/status
3. Update reservation status
4. Create a new reservation from admin

#### Menu Tab
1. View menu items
2. Create a new menu item with:
   - Name, description, price
   - Category assignment
   - Dietary preferences
   - Image upload (if implemented)
3. Edit an existing menu item
4. Delete a menu item

#### Users Tab (Admin only)
1. View all users
2. Test editing user roles
3. Test user activation/deactivation
4. Create a new staff account

## API Testing

Use a tool like Postman, Insomnia, or even `curl` to test API endpoints:

### Auth API
```bash
# Get CSRF token
curl -X GET http://localhost:3000/api/auth/csrf -c cookies.txt

# Login
curl -X POST http://localhost:3000/api/auth/callback/credentials \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"email":"admin@restaurant.com","password":"Admin123!","csrfToken":"TOKEN_FROM_PREVIOUS_REQUEST"}'
```

### Menu API
```bash
# Get all menu items
curl -X GET http://localhost:3000/api/menu

# Get filtered menu items
curl -X GET "http://localhost:3000/api/menu?category=Appetizers&dietary=vegetarian"
```

### Bookings API
```bash
# Create a booking
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"customerName":"Test User","email":"test@example.com","phone":"1234567890","partySize":4,"bookingTime":"2023-10-20T18:00:00.000Z"}'

# Get bookings (requires auth)
curl -X GET http://localhost:3000/api/bookings -b cookies.txt
```

### Orders API
```bash
# Create an order (requires auth)
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"items":[{"menuItemId":"item-id-1","quantity":2}],"orderType":"PICKUP"}'

# Get orders (requires auth)
curl -X GET http://localhost:3000/api/orders -b cookies.txt
```

### Promotions API
```bash
# Get all promotions (admin only)
curl -X GET http://localhost:3000/api/promotions -b cookies.txt

# Get active promotions
curl -X GET "http://localhost:3000/api/promotions?active=true" -b cookies.txt

# Validate a coupon code
curl -X POST http://localhost:3000/api/promotions/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"WELCOME10","cartItems":[{"menuItemId":"item-id-1","quantity":2,"price":10.99}],"cartTotal":21.98}'

# Create a new promotion (admin only)
curl -X POST http://localhost:3000/api/promotions \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"New Customer Discount","description":"$10 off your first order","promotionType":"FIXED_AMOUNT_DISCOUNT","value":10,"minimumOrderValue":30,"startDate":"2023-01-01T00:00:00Z","endDate":"2023-12-31T23:59:59Z","isActive":true,"couponCode":"WELCOME10","applyToAllItems":true}'

# Apply a promotion to an order
curl -X POST http://localhost:3000/api/promotions/apply \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"promotionId":"promotion-id","orderId":"order-id"}'
```

## Cross-Browser Testing

Test the application in multiple browsers to ensure compatibility:

1. Chrome (latest)
2. Firefox (latest)
3. Safari (latest)
4. Edge (latest)

## Mobile Testing

Test responsive behavior on various screen sizes:

1. Desktop (1920×1080)
2. Laptop (1366×768)
3. Tablet (768×1024)
4. Mobile (375×667)

Check for:
- Proper layout adaptation
- Touch-friendly controls
- Readable text
- Functional navigation

## Performance Testing

1. **Page Load Times**:
   - Use browser developer tools to measure page load times
   - Target: < 2 seconds for initial load

2. **API Response Times**:
   - Measure API endpoint performance
   - Target: < 300ms for most operations

3. **Database Performance**:
   - Test with larger data sets
   - Check query performance using database tools

## Security Testing

1. **Authentication**:
   - Test password requirements
   - Verify account lockout after failed attempts
   - Test session timeout and renewal

2. **Authorization**:
   - Verify role-based access control
   - Attempt to access resources without permission
   - Check API endpoint protection

3. **Data Validation**:
   - Test form inputs with special characters
   - Try SQL injection in form fields
   - Test file upload security (if implemented)

4. **CSRF Protection**:
   - Verify CSRF tokens are required for state-changing operations

## Accessibility Testing

1. **Keyboard Navigation**:
   - Navigate the entire site using only keyboard
   - Check tab order and focus visibility

2. **Screen Readers**:
   - Test with VoiceOver (Mac) or NVDA (Windows)
   - Verify all content is accessible

3. **Color Contrast**:
   - Verify text has sufficient contrast with backgrounds
   - Use tools like Lighthouse to check

## Automated Testing

To run the automated test suite (if implemented):

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- -t "authentication"
```

### End-to-End Testing

If Cypress is set up, run end-to-end tests:

```bash
# Open Cypress test runner
npx cypress open

# Run tests headlessly
npx cypress run
```

## Test Accounts

Use these seeded accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@restaurant.com | Admin123! |
| Chef | chef@restaurant.com | Admin123! |
| Waiter | waiter@restaurant.com | Admin123! |
| Customer | customer@example.com | User123! |

## Bug Reporting Procedure

When you find an issue:

1. **Document the bug**:
   - Page/feature where bug occurred
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Screenshots if applicable
   - Browser/device information

2. **Rate severity**:
   - Critical: Blocking functionality, security issue
   - Major: Significant feature broken but workaround exists
   - Minor: Non-critical UI issue or rare edge case

3. **Report the bug**:
   - Create an issue in your project management tool
   - Include all documented information
   - Add labels for categorization

## Testing Specific Features

### Dietary Preferences
1. Create menu items with different dietary tags
2. Verify filter buttons appear for all dietary options
3. Test each filter individually
4. Test combinations of filters

### Promotions and Discount System
1. **Admin Promotion Creation**:
   - Login as admin
   - Navigate to Menu Management → Promotions tab
   - Create different types of promotions:
     - Percentage discount (e.g., 20% off)
     - Fixed amount discount (e.g., $5 off)
     - Free item promotion
     - Buy one get one (BOGO)
   - Test with and without coupon codes
   - Set different date ranges (active, future, expired)
   - Test minimum order requirements

2. **Coupon Validation Testing**:
   - Add items to cart
   - Try invalid coupon codes (verify error messages)
   - Try expired coupon codes
   - Try coupon with minimum order requirement:
     - Below threshold (should fail)
     - Above threshold (should apply)
   - Try a coupon that has reached its usage limit

3. **Discount Application Testing**:
   - Apply percentage discount and verify correct amount is discounted
   - Apply fixed amount discount and verify exact amount is removed
   - Test BOGO promotions with different combinations of items
   - Test free item promotions

4. **Checkout and Payment Testing**:
   - Apply a valid coupon at checkout
   - Complete payment using test card (4242 4242 4242 4242)
   - Verify the discount appears correctly on:
     - Order confirmation page
     - Order details in user account
     - Admin order view

5. **Stripe Webhook Testing**:
   - Apply discount and complete checkout
   - Use Stripe CLI to verify webhook events are received:
     ```bash
     stripe listen --forward-to localhost:3000/api/webhook/stripe
     ```
   - Verify sales record is created with the correct discount amount
   - Check that the sales record notes mention the discount

6. **API Testing for Promotions**:
   ```bash
   # Get all promotions (admin only)
   curl -X GET http://localhost:3000/api/promotions -b cookies.txt
   
   # Validate a coupon code
   curl -X POST http://localhost:3000/api/promotions/validate \
     -H "Content-Type: application/json" \
     -d '{"code":"WELCOME10","cartItems":[{"menuItemId":"item-id-1","quantity":2,"price":10.99}],"cartTotal":21.98}'
   ```

7. **Promotion Usage Tracking**:
   - Apply a coupon with usage limit
   - Verify usage count increases in admin dashboard
   - Try to use the same coupon multiple times until limit is reached

### Table Reservation Logic
1. Book a large table (8+ people)
2. Book multiple small tables for the same time
3. Test edge cases:
   - Booking right at closing time
   - Booking for maximum capacity
   - Booking adjacent time slots

### Order Status Flow
1. Create a new order
2. As staff, update status through each stage:
   - PENDING → CONFIRMED → PREPARING → READY_FOR_PICKUP → COMPLETED
3. Verify status updates appear for the customer
4. Test cancellation at different stages 