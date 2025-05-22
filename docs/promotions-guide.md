# Promotions System Guide

This document provides a comprehensive guide to the promotions system in the Restaurant Application, including how to create, manage, and implement various types of discounts and special offers.

## Table of Contents

1. [Overview](#overview)
2. [Promotion Types](#promotion-types)
3. [Creating Promotions](#creating-promotions)
4. [Managing Promotions](#managing-promotions)
5. [Applying Promotions at Checkout](#applying-promotions-at-checkout)
6. [API Endpoints](#api-endpoints)
7. [Technical Implementation](#technical-implementation)
8. [Best Practices](#best-practices)

## Overview

The promotions system allows restaurant administrators to create various types of special offers and discounts to attract customers and drive sales. Promotions can be applied automatically or via coupon codes entered at checkout.

Key features include:
- Multiple promotion types (percentage discounts, fixed amounts, free items, and buy-one-get-one)
- Time-based promotions with start and end dates
- Coupon code functionality
- Targeting specific menu items or categories
- Usage limits and tracking

## Promotion Types

The system supports four types of promotions:

### 1. Percentage Discount
Applies a percentage discount to eligible items or the entire order.
- Example: "20% off all appetizers"
- Configuration: Set percentage value (e.g., 20)

### 2. Fixed Amount Discount
Applies a fixed amount discount to eligible items or the entire order.
- Example: "$5 off orders over $30"
- Configuration: Set amount value (e.g., 5.00) and minimum order value (e.g., 30.00)

### 3. Free Item
Adds a specific menu item for free when qualifying purchases are made.
- Example: "Free dessert with any entrée purchase"
- Configuration: Select the free item from the menu items list

### 4. Buy One Get One (BOGO)
When purchasing eligible items, the lowest-priced item is free.
- Example: "Buy one pizza, get one free"
- Configuration: No additional configuration needed beyond selecting eligible items

## Creating Promotions

To create a new promotion:

1. Navigate to the Admin Dashboard
2. Go to the Menu Management section
3. Select the "Promotions" tab
4. Click "Add Promotion"

### Basic Details Tab

- **Name**: Enter a descriptive name for the promotion (required)
- **Description**: Provide details about the promotion (optional)
- **Start Date**: Set when the promotion becomes active
- **End Date**: Set when the promotion expires
- **Active**: Toggle whether the promotion is currently active
- **Coupon Code**: Enter a code customers will use to apply this promotion (optional)
- **Usage Limit**: Set maximum number of times this promotion can be used (optional)

### Promotion Rules Tab

- **Promotion Type**: Select from the available types
- **Value**: Enter the percentage or amount, depending on promotion type
- **Minimum Order Value**: Set minimum purchase requirement (optional)
- **Free Item**: If promotion type is "Free Item", select the menu item to give away

### Applicable Items Tab

- **Apply to All Items**: Toggle whether the promotion applies to everything
- If not applying to all items, select specific:
  - **Categories**: Choose which menu categories are eligible
  - **Menu Items**: Choose which specific items are eligible

## Managing Promotions

The promotions management interface provides several tools:

### Promotions Table
The main promotions tab displays all promotions with key information:
- Name and description
- Type and value
- Status (Active, Scheduled, Expired, Inactive)
- Date range
- Usage statistics

### Editing Promotions
To edit an existing promotion:
1. Click the Edit button next to the promotion in the table
2. Make your changes across the tabs
3. Save changes

### Deleting Promotions
To delete a promotion:
1. Click the Delete button next to the promotion in the table
2. Confirm deletion in the confirmation dialog

### Tracking Usage
Usage statistics show how many times each promotion has been applied, helping you evaluate its effectiveness.

## Applying Promotions at Checkout

Promotions can be applied to orders in two ways:

### Automatic Application
Promotions without coupon codes are applied automatically at checkout if:
- The promotion is active
- The current date is within the promotion's date range
- The order meets minimum requirements
- The usage limit hasn't been reached

### Coupon Codes
For promotions with coupon codes:
1. The customer enters the code in the coupon input field at checkout
2. The system validates the code and eligibility
3. If valid, the discount is applied to the order

### Implementation in Checkout Flow

To integrate the coupon code functionality in the checkout flow:

1. Add the `CouponInput` component to your checkout page:

```tsx
import { CouponInput } from "@/app/checkout/coupon-input";

// Inside your checkout component
const [promotion, setPromotion] = useState(null);
const [discount, setDiscount] = useState(0);

const handleApplyCoupon = (newPromotion, newDiscount) => {
  setPromotion(newPromotion);
  setDiscount(newDiscount);
  // Recalculate order total
  updateTotal(subtotal - newDiscount);
};

// In your JSX
<CouponInput 
  onApply={handleApplyCoupon}
  cartItems={cartItems}
  cartTotal={subtotal}
  disabled={isProcessing}
/>

// When displaying the order summary
<div className="order-summary">
  <div className="subtotal">Subtotal: ${subtotal.toFixed(2)}</div>
  {discount > 0 && (
    <div className="discount">
      Discount ({promotion.name}): -${discount.toFixed(2)}
    </div>
  )}
  <div className="total">Total: ${(subtotal - discount).toFixed(2)}</div>
</div>
```

2. When creating the order, include the promotion information:

```tsx
// When submitting the order
const createOrder = async () => {
  // ... other order creation logic
  
  // If a promotion was applied
  if (promotion) {
    // Include promotion ID with the order
    orderData.appliedPromotionId = promotion.id;
    orderData.discountAmount = discount;
    
    // After order is created, record promotion usage
    await fetch('/api/promotions/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        promotionId: promotion.id, 
        orderId: createdOrder.id 
      })
    });
  }
  
  // ... continue with order completion
};
```

## API Endpoints

The promotions system provides several API endpoints:

### GET /api/promotions
Fetches all promotions or filters by query parameters.
- Query Parameters:
  - `active`: Filter by active status (boolean)
  - `current`: Filter by currently valid promotions (boolean)
  - `couponCode`: Find promotion by coupon code (string)

### GET /api/promotions/:id
Fetches a specific promotion by ID.

### POST /api/promotions
Creates a new promotion (admin only).

### PUT /api/promotions/:id
Updates an existing promotion (admin only).

### DELETE /api/promotions/:id
Deletes a promotion (admin only).

### POST /api/promotions/validate
Validates a coupon code and calculates the applicable discount.
- Parameters:
  - `code`: Coupon code to validate
  - `cartItems`: Array of cart items with menuItemId, quantity, and price
  - `cartTotal`: Total cart amount
- Returns:
  - Promotion details
  - Calculated discount
  - Discounted items
  - Free item details (if applicable)

### POST /api/promotions/apply
Records the application of a promotion to an order.
- Parameters:
  - `promotionId`: ID of the promotion to apply
  - `orderId`: ID of the order the promotion is applied to

## Technical Implementation

The promotions system is implemented across several parts of the application:

### Database Schema

The `Promotion` model in the Prisma schema includes:

```prisma
model Promotion {
  id                String        @id @default(cuid())
  name              String
  description       String?
  promotionType     PromotionType
  value             Decimal       // Percentage or fixed amount
  minimumOrderValue Decimal?      // For minimum purchase requirements
  startDate         DateTime
  endDate           DateTime
  isActive          Boolean       @default(true)

  // For FREE_ITEM promotions
  freeItemId        String?
  freeItem          MenuItem?     @relation(fields: [freeItemId], references: [id])

  // For coupon codes
  couponCode        String?       @unique
  usageLimit        Int?          // Max number of uses
  usageCount        Int           @default(0)

  // For specific menu items or categories
  applyToAllItems   Boolean       @default(false)
  menuItems         MenuItem[]    @relation("MenuItemPromotions")
  categories        Category[]    @relation("CategoryPromotions")

  // For tracking
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  // Relations
  appliedOrders     Order[]
}

enum PromotionType {
  PERCENTAGE_DISCOUNT
  FIXED_AMOUNT_DISCOUNT
  FREE_ITEM
  BUY_ONE_GET_ONE
}
```

### Server Actions

Server actions in `lib/actions/promotion-action.ts` handle the business logic for creating, updating, and managing promotions.

### API Routes

The API routes in `app/api/promotions/` handle validation and application of promotions, with key endpoints:
- `validate/route.ts`: Validates coupon codes and calculates discounts
- `apply/route.ts`: Records promotion usage and links promotions to orders

### UI Components

- Admin UI: The promotions tab in the menu management interface
- Customer UI: The coupon input component for checkout

## Best Practices

### Effective Promotion Strategies

1. **Limited-Time Offers**: Create urgency with short-duration promotions
2. **Seasonal Promotions**: Align offers with holidays or seasons
3. **New Item Promotions**: Encourage trying new menu items
4. **Minimum Purchase Promotions**: Increase average order value
5. **Loyalty Rewards**: Encourage repeat business

### Implementation Tips

1. **Test Thoroughly**: Verify all promotion types work as expected before going live
2. **Monitor Usage**: Track which promotions are most effective
3. **Clear Communication**: Ensure promotion rules are clearly explained to customers
4. **Avoid Overlap**: Be careful with multiple concurrent promotions that might conflict
5. **Set Limits**: Use usage limits to control promotion costs

### Examples

**Percentage Discount Example**:
- Name: "Weekday Lunch Special"
- Description: "20% off all orders between 11am-2pm, Monday to Friday"
- Type: Percentage Discount
- Value: 20
- Start Date: [Current Date]
- End Date: [30 days later]
- Active: Yes
- Apply to All Items: Yes

**BOGO Example**:
- Name: "Buy One Get One Pizza"
- Description: "Buy any pizza, get one of equal or lesser value free"
- Type: Buy One Get One
- Start Date: [Current Date]
- End Date: [14 days later]
- Active: Yes
- Apply to All Items: No
- Categories: "Pizzas"

**Coupon Code Example**:
- Name: "New Customer Discount"
- Description: "$10 off your first order of $30 or more"
- Type: Fixed Amount Discount
- Value: 10
- Minimum Order Value: 30
- Coupon Code: "WELCOME10"
- Usage Limit: 1 per customer
- Start/End Dates: [Ongoing]
- Active: Yes

By following these guidelines and utilizing the promotions system effectively, you can create compelling offers that attract customers and drive sales for your restaurant. 