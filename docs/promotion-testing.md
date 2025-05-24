# Promotions System Test Cases

This document outlines test cases for validating the restaurant application's promotions and discount system.

## Test Environment Setup

Before beginning testing, ensure:

1. Test database is properly seeded with menu items across multiple categories
2. Admin account is available for creating test promotions
3. Stripe test mode is active
4. Stripe CLI is running to forward webhooks: `stripe listen --forward-to localhost:3000/api/webhook/stripe`

## 1. Basic Coupon Functionality

### Test Case 1.1: Apply Valid Coupon

**Steps:**
1. Login as a customer
2. Add items to cart totaling at least $20
3. Proceed to checkout
4. Enter coupon code "WELCOME10" for $10 off
5. Complete checkout with test card (4242 4242 4242 4242)

**Expected Results:**
- Coupon validation shows success message
- Order summary shows $10 discount
- Stripe payment amount reflects discounted total
- Confirmation page shows correct total with discount applied
- Sales record in database includes discount amount of $10
- Promotion usage count increments by 1

### Test Case 1.2: Invalid Coupon Code

**Steps:**
1. Add items to cart
2. Proceed to checkout
3. Enter invalid coupon code "INVALID123"

**Expected Results:**
- Error message "Invalid coupon code" appears
- No discount is applied
- Order total remains unchanged

## 2. Different Promotion Types

### Test Case 2.1: Percentage Discount

**Steps:**
1. Login as admin
2. Create a promotion:
   - Name: "25% Off Test"
   - Type: Percentage Discount
   - Value: 25
   - Coupon Code: "PERCENT25"
   - Apply to all items: Yes
3. Login as customer
4. Add items to cart
5. Apply "PERCENT25" coupon
6. Complete checkout

**Expected Results:**
- 25% discount applied to cart total
- Discount amount equals 25% of cart subtotal
- Order and sales records show correct discount amount

### Test Case 2.2: Fixed Amount Discount

**Steps:**
1. Login as admin
2. Create a promotion:
   - Name: "$15 Off Test"
   - Type: Fixed Amount Discount
   - Value: 15
   - Coupon Code: "FLAT15"
   - Apply to all items: Yes
3. Login as customer
4. Add items to cart totaling at least $20
5. Apply "FLAT15" coupon
6. Complete checkout

**Expected Results:**
- $15 discount applied to cart total
- Order and sales records show discount amount of $15

### Test Case 2.3: Free Item Promotion

**Steps:**
1. Login as admin
2. Create a promotion:
   - Name: "Free Dessert"
   - Type: Free Item
   - Free Item: Select a dessert item
   - Coupon Code: "FREEDESSERT"
3. Login as customer
4. Add items to cart
5. Apply "FREEDESSERT" coupon
6. Complete checkout

**Expected Results:**
- Selected dessert item added to cart with $0 price
- Order summary shows free item
- Order and sales records include the free item

### Test Case 2.4: Buy One Get One (BOGO)

**Steps:**
1. Login as admin
2. Create a promotion:
   - Name: "Buy One Get One Pizza"
   - Type: Buy One Get One
   - Category: Pizza (or similar)
   - Coupon Code: "BOGOPIZZA"
3. Login as customer
4. Add two pizza items to cart
5. Apply "BOGOPIZZA" coupon
6. Complete checkout

**Expected Results:**
- Price of cheaper pizza item is deducted from total
- Order summary shows BOGO discount
- Order and sales records show correct discount amount

## 3. Minimum Order Requirements

### Test Case 3.1: Below Minimum Requirement

**Steps:**
1. Login as admin
2. Create a promotion:
   - Name: "$5 Off Orders Over $30"
   - Type: Fixed Amount Discount
   - Value: 5
   - Minimum Order Value: 30
   - Coupon Code: "MIN30"
3. Login as customer
4. Add items to cart totaling $25
5. Try to apply "MIN30" coupon

**Expected Results:**
- Error message "Minimum order amount of $30 required"
- No discount applied
- Checkout proceeds with original total

### Test Case 3.2: Above Minimum Requirement

**Steps:**
1. Using same promotion as Test Case 3.1
2. Add items to cart totaling $35
3. Apply "MIN30" coupon
4. Complete checkout

**Expected Results:**
- $5 discount successfully applied
- Order and sales records show discount amount of $5

## 4. Date Limitations

### Test Case 4.1: Future Start Date

**Steps:**
1. Login as admin
2. Create a promotion:
   - Name: "Future Promotion"
   - Type: Percentage Discount
   - Value: 10
   - Start Date: Tomorrow's date
   - End Date: 30 days from now
   - Coupon Code: "FUTURE10"
3. Login as customer
4. Add items to cart
5. Try to apply "FUTURE10" coupon

**Expected Results:**
- Error message "This promotion is not active yet"
- No discount applied

### Test Case 4.2: Expired Promotion

**Steps:**
1. Login as admin
2. Create a promotion:
   - Name: "Expired Promotion"
   - Type: Percentage Discount
   - Value: 10
   - Start Date: 30 days ago
   - End Date: Yesterday's date
   - Coupon Code: "EXPIRED10"
3. Login as customer
4. Add items to cart
5. Try to apply "EXPIRED10" coupon

**Expected Results:**
- Error message "This promotion has expired"
- No discount applied

## 5. Usage Limits

### Test Case 5.1: Reaching Usage Limit

**Steps:**
1. Login as admin
2. Create a promotion:
   - Name: "Limited Use Promotion"
   - Type: Fixed Amount Discount
   - Value: 5
   - Usage Limit: 2
   - Coupon Code: "LIMITED5"
3. Login as customer
4. Complete 2 separate orders using the "LIMITED5" coupon
5. Try to use the coupon for a third order

**Expected Results:**
- First two orders: Coupon applies successfully
- Third order: Error message "This promotion has reached its usage limit"
- Admin dashboard shows usage count of 2/2 for this promotion

## 6. Item Specificity

### Test Case 6.1: Category-Specific Promotion

**Steps:**
1. Login as admin
2. Create a promotion:
   - Name: "Appetizer Discount"
   - Type: Percentage Discount
   - Value: 15
   - Apply to All Items: No
   - Categories: Select only "Appetizers"
   - Coupon Code: "APPS15"
3. Login as customer
4. Add only appetizer items to cart
5. Apply "APPS15" coupon
6. Complete checkout

**Expected Results:**
- 15% discount applied to all appetizer items
- Order and sales records show correct discount amount

### Test Case 6.2: Mixed Cart with Category-Specific Promotion

**Steps:**
1. Using same promotion as Test Case 6.1
2. Add a mix of appetizers and main courses to cart
3. Apply "APPS15" coupon
4. Complete checkout

**Expected Results:**
- Discount only applied to appetizer items
- Main courses remain at full price
- Order summary shows partial discount
- Order and sales records show correct partial discount amount

## 7. Edge Cases

### Test Case 7.1: 100% Discount

**Steps:**
1. Login as admin
2. Create a promotion:
   - Name: "100% Off Small Order"
   - Type: Percentage Discount
   - Value: 100
   - Maximum Discount: $15 (to limit abuse)
   - Minimum Order Value: $1
   - Coupon Code: "FULL100"
3. Login as customer
4. Add items totaling $10
5. Apply "FULL100" coupon
6. Complete checkout

**Expected Results:**
- Full discount applied (price becomes $0)
- Order completes successfully
- Order and sales records show 100% discount

### Test Case 7.2: Decimal Values in Fixed Discounts

**Steps:**
1. Login as admin
2. Create a promotion:
   - Name: "Odd Discount"
   - Type: Fixed Amount Discount
   - Value: 4.99
   - Coupon Code: "ODD499"
3. Login as customer
4. Add items to cart
5. Apply "ODD499" coupon
6. Complete checkout

**Expected Results:**
- Exactly $4.99 is discounted from the total
- Order and sales records show discount of $4.99

## 8. Admin Features

### Test Case 8.1: Verify Usage Statistics

**Steps:**
1. Login as admin
2. Create a promotion with coupon code "TRACKME"
3. Login as customer and complete an order using "TRACKME"
4. Login as admin
5. Navigate to Menu Management → Promotions tab
6. Find the "TRACKME" promotion

**Expected Results:**
- Usage count shows 1
- Promotion details show correctly

### Test Case 8.2: Edit Promotion

**Steps:**
1. Login as admin
2. Edit an existing promotion:
   - Change name to "Updated Promotion"
   - Change discount value from 10% to 15%
   - Save changes
3. Login as customer
4. Try to apply the coupon

**Expected Results:**
- Updated 15% discount is applied
- Admin dashboard shows the updated name

### Test Case 8.3: Deactivate Promotion

**Steps:**
1. Login as admin
2. Find an active promotion
3. Edit it and set "Active" to No
4. Save changes
5. Login as customer
6. Try to apply the coupon code

**Expected Results:**
- Error message "This promotion is not active"
- No discount applied

## 9. Sales Record and Reporting

### Test Case 9.1: Verify Sales Record with Discount

**Steps:**
1. Login as customer
2. Add items to cart
3. Apply a valid coupon (e.g., 20% off)
4. Complete checkout
5. Login as admin
6. Check the sales record for the order

**Expected Results:**
- Sales record includes the discount amount
- Sales record notes mention the discount applied
- Sales record shows correct final total (after discount)

### Test Case 9.2: Verify Webhook Handling of Discount

**Steps:**
1. Ensure Stripe CLI is running (`stripe listen --forward-to localhost:3000/api/webhook/stripe`)
2. Login as customer
3. Add items to cart
4. Apply valid coupon
5. Complete checkout
6. Check terminal output from Stripe CLI

**Expected Results:**
- Webhook events show successful processing
- Terminal logs show discount being extracted from metadata
- Terminal logs confirm sales record creation with discount amount

## 12. Analytics Dashboard Testing

### Test Case 12.1: Basic Analytics Display

**Prerequisites:** Complete at least a few promotion tests from above

**Steps:**
1. Login as admin
2. Navigate to Menu Management → Analytics tab
3. Verify analytics load without errors
4. Check that metrics display properly:
   - Total Uses count
   - Revenue Impact amount
   - Total Discounts amount
   - Average Order Value

**Expected Results:**
- Analytics page loads successfully
- All metrics cards show numerical values
- Data reflects recent promotion usage
- Date range selector works (7, 30, 90 days, 1 year)

**Test Result:** ✅ Pass / ❌ Fail  
**Notes:** _[Record any observations]_

---

### Test Case 12.2: Top Performing Promotions

**Steps:**
1. Use different promotions with varying discount amounts
2. Complete several orders with different promotions
3. Return to Analytics tab
4. Verify "Top Performing Promotions" section

**Expected Results:**
- Promotions appear ranked by revenue impact
- Usage counts are accurate
- Revenue impact calculations are correct
- Only shows top 5 promotions

**Test Result:** ✅ Pass / ❌ Fail  
**Notes:** _[Record any observations]_

---

### Test Case 12.3: Customer Segmentation

**Steps:**
1. Create orders with:
   - New customer (1st order)
   - Returning customer (2-10 orders)
   - VIP customer (10+ orders)
2. Apply promotions to each type
3. Check Customer Segments analytics

**Expected Results:**
- Segments show: new, returning, vip
- Percentages add up to 100%
- Counts match actual usage

**Test Result:** ✅ Pass / ❌ Fail  
**Notes:** _[Record any observations]_

---

### Test Case 12.4: Recent Usage Tracking

**Steps:**
1. Apply various promotions
2. Note the time and promotion details
3. Check "Recent Usage" section

**Expected Results:**
- Shows most recent 5 usage records
- Displays promotion name and coupon code
- Shows discount amount and date
- Marks first-time users correctly

**Test Result:** ✅ Pass / ❌ Fail  
**Notes:** _[Record any observations]_

---

### Test Case 12.5: Date Range Filtering

**Steps:**
1. Create orders with promotions over different time periods
2. Test each date range filter:
   - Last 7 days
   - Last 30 days (default)
   - Last 90 days
   - Last year
3. Verify data changes appropriately

**Expected Results:**
- Metrics update when date range changes
- Historical data is filtered correctly
- Recent vs. older usage shows different results

**Test Result:** ✅ Pass / ❌ Fail  
**Notes:** _[Record any observations]_

---

## Phase 1 Completion Checklist

✅ **Database Setup**
- PromotionUsage table created
- Proper indexes and relationships established

✅ **Webhook Integration**
- Stripe webhook creates PromotionUsage records
- Customer segmentation logic working
- Time-to-conversion tracking

✅ **Analytics Dashboard**
- Basic metrics display correctly
- Top promotions ranking
- Customer segment breakdown
- Recent usage feed
- Date range filtering

✅ **Documentation**
- Testing procedures updated
- Analytics features documented

---

## Next Steps: Phase 2 Planning

After completing Phase 1 testing, consider implementing Phase 2 features:

1. **Advanced Analytics**
   - ROI calculations
   - Cohort analysis
   - Conversion funnels

2. **Automated Insights**
   - Best performing promotion types
   - Optimal discount amounts
   - Customer lifetime value impact

3. **Export & Reporting**
   - CSV/PDF exports
   - Scheduled reports
   - Custom date ranges

## Test Results Documentation

For each test case, document:

1. Test date and time
2. Tester name
3. Test environment (local, staging, production)
4. Test result (Pass/Fail)
5. Notes and observations
6. Screenshots (if applicable)
7. Any errors or unexpected behaviors

Use the table below to track test results:

| Test ID | Test Date | Tester | Environment | Result | Notes |
|---------|-----------|--------|-------------|--------|-------|
| 1.1     |           |        |             |        |       |
| 1.2     |           |        |             |        |       |
| 2.1     |           |        |             |        |       |
| ...     |           |        |             |        |       |

## Regression Testing

After any changes to the promotions system, re-run the following critical tests:

1. Test Case 1.1 (Basic coupon application)
2. Test Case 2.1 (Percentage discount)
3. Test Case 2.2 (Fixed amount discount)
4. Test Case 3.1 (Minimum order requirement)
5. Test Case 9.1 (Sales record verification) 