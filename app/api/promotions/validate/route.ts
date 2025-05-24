import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { Decimal } from "@prisma/client/runtime/library";

// Define CartItem type locally
type CartItem = {
  menuItemId: string;
  quantity: number;
  price: number;
};

export async function POST(request: NextRequest) {
  try {
    const { code, cartItems, cartTotal } = await request.json();

    if (!code || !cartItems || cartTotal === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find the promotion by coupon code
    const promotion = await prisma.promotion.findUnique({
      where: {
        couponCode: code.toUpperCase(),
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      },
      include: {
        menuItems: true,
        categories: true,
        freeItem: true
      }
    });

    // If no promotion found or promotion is inactive or expired
    if (!promotion) {
      return NextResponse.json(
        { error: "Invalid or expired coupon code" },
        { status: 404 }
      );
    }

    // Check if promotion has reached usage limit
    if (promotion.usageLimit && promotion.usageCount >= promotion.usageLimit) {
      return NextResponse.json(
        { error: "This coupon has reached its usage limit" },
        { status: 400 }
      );
    }

    // Calculate the discount based on promotion type
    let discount = 0;
    let discountedItems: CartItem[] = [];
    let freeItem = null;

    // If not apply to all items, filter eligible items
    let eligibleItems: CartItem[] = [];
    
    if (promotion.applyToAllItems) {
      eligibleItems = cartItems;
    } else {
      // Fetch menu items with their categories for the cart items
      const cartMenuItemIds = cartItems.map((item: CartItem) => item.menuItemId);
      const menuItemsWithCategories = await prisma.menuItem.findMany({
        where: {
          id: { in: cartMenuItemIds }
        },
        select: {
          id: true,
          categoryId: true
        }
      });

      eligibleItems = cartItems.filter((item: CartItem) => {
        // Check if item is directly eligible (specific menu item selected)
        if (promotion.menuItems.some(menuItem => menuItem.id === item.menuItemId)) {
          return true;
        }

        // Check if item belongs to eligible category
        const menuItemData = menuItemsWithCategories.find(mi => mi.id === item.menuItemId);
        if (menuItemData && promotion.categories.some(category => category.id === menuItemData.categoryId)) {
          return true;
        }

        return false;
      });
    }

    if (eligibleItems.length === 0 && !promotion.applyToAllItems) {
      return NextResponse.json(
        { error: "No eligible items for this promotion" },
        { status: 400 }
      );
    }

    // Check minimum order value if applicable
    if (promotion.minimumOrderValue && cartTotal < promotion.minimumOrderValue.toNumber()) {
      return NextResponse.json({
        error: `Minimum order value of $${promotion.minimumOrderValue.toNumber().toFixed(2)} required for this coupon`,
        minimumOrderValue: promotion.minimumOrderValue.toNumber()
      }, { status: 400 });
    }

    // Calculate discount based on promotion type
    switch (promotion.promotionType) {
      case "PERCENTAGE_DISCOUNT":
        const percentageValue = promotion.value.toNumber();
        const eligibleTotal = promotion.applyToAllItems
          ? cartTotal
          : eligibleItems.reduce((sum: number, item: CartItem) => sum + (item.price * item.quantity), 0);
        
        discount = (eligibleTotal * percentageValue) / 100;
        discountedItems = eligibleItems;
        break;

      case "FIXED_AMOUNT_DISCOUNT":
        discount = Math.min(promotion.value.toNumber(), cartTotal);
        discountedItems = eligibleItems;
        break;

      case "FREE_ITEM":
        if (promotion.freeItem) {
          freeItem = promotion.freeItem;
          discount = promotion.freeItem.price ? parseFloat(promotion.freeItem.price.toString()) : 0;
        }
        break;

      case "BUY_ONE_GET_ONE":
        // Find eligible pairs and discount the cheaper one
        const itemsByType: { [key: string]: CartItem[] } = {};
        
        // Group items by menuItemId
        eligibleItems.forEach((item: CartItem) => {
          if (!itemsByType[item.menuItemId]) {
            itemsByType[item.menuItemId] = [];
          }
          // Create individual items based on quantity
          for (let i = 0; i < item.quantity; i++) {
            itemsByType[item.menuItemId].push({
              ...item,
              quantity: 1
            });
          }
        });
        
        // For each item type, if we have at least 2, discount the cheaper one
        Object.values(itemsByType).forEach(items => {
          if (items.length >= 2) {
            // Sort by price, lowest first
            items.sort((a, b) => a.price - b.price);
            // Take the first item (cheapest) and add its price to the discount
            discount += items[0].price;
            discountedItems.push(items[0]);
          }
        });
        break;

      default:
        break;
    }

    // Round discount to 2 decimal places
    discount = Math.min(discount, cartTotal);
    discount = Math.round(discount * 100) / 100;

    return NextResponse.json({
      success: true,
      message: `${promotion.name} applied successfully!`,
      promotion: {
        id: promotion.id,
        name: promotion.name,
        description: promotion.description,
        type: promotion.promotionType,
        couponCode: promotion.couponCode
      },
      discount,
      discountedItems: discountedItems.length > 0 ? discountedItems : undefined,
      freeItem: freeItem ? {
        id: freeItem.id,
        name: freeItem.name,
        price: freeItem.price
      } : undefined
    });

  } catch (error) {
    console.error("Error validating promotion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 