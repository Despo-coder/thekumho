import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// import { Prisma } from "@prisma/client";

// GET /api/menu - Get menu items with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const dietary = searchParams.get("dietary");
    const search = searchParams.get("search");

    // Base query to fetch categories with menu items
    const categories = await prisma.category.findMany({
      include: {
        items: {
          include: {
            menu: true,
            reviews: true,
          },
          where: {
            isAvailable: true,
            // Add conditions based on search params if needed
            ...(search
              ? {
                  OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                  ],
                }
              : {}),
            // Filter by dietary preferences if provided
            ...(dietary === "vegetarian" ? { isVegetarian: true } : {}),
            ...(dietary === "vegan" ? { isVegan: true } : {}),
            ...(dietary === "glutenFree" ? { isGlutenFree: true } : {}),
            ...(dietary === "dairyFree" ? { isDairyFree: true } : {}),
          },
        },
      },
      // Filter by specific category if provided
      ...(category ? { where: { id: category } } : {}),
    });

    // Filter out categories with no items (can be done client-side too)
    const filteredCategories = categories.filter(cat => cat.items.length > 0);

    return NextResponse.json({
      categories: filteredCategories,
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu items" },
      { status: 500 }
    );
  }
}

// POST /api/menu - Create a new menu item (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    // Check authentication and authorization
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate required fields
    if (!body.name || !body.price || !body.categoryId || !body.menuId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        name: body.name,
        description: body.description || null,
        price: body.price,
        image: body.image || null,
        categoryId: body.categoryId,
        menuId: body.menuId,
        isAvailable: body.isAvailable !== undefined ? body.isAvailable : true,
        isVegetarian: body.isVegetarian || false,
        isVegan: body.isVegan || false,
        isPescatarian: body.isPescatarian || false,
        isGlutenFree: body.isGlutenFree || false,
        isDairyFree: body.isDairyFree || false,
        isNutFree: body.isNutFree || false,
        isSpicy: body.isSpicy || false,
      },
    });

    return NextResponse.json(menuItem, { status: 201 });
  } catch (error) {
    console.error("Error creating menu item:", error);
    return NextResponse.json(
      { error: "Failed to create menu item" },
      { status: 500 }
    );
  }
}

// PATCH /api/menu/batch - Update multiple menu items
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    // Check authentication and authorization
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate request
    if (!body.itemIds || !Array.isArray(body.itemIds) || !body.data) {
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    // Update items in transaction
    const updates = body.itemIds.map((id: string) =>
      prisma.menuItem.update({
        where: { id },
        data: body.data,
      })
    );

    const result = await prisma.$transaction(updates);

    return NextResponse.json({ success: true, count: result.length });
  } catch (error) {
    console.error("Error updating batch menu items:", error);
    return NextResponse.json(
      { error: "Failed to update batch menu items" },
      { status: 500 }
    );
  }
} 