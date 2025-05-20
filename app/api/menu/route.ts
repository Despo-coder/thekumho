import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// GET /api/menu - Get menu items with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const menuId = searchParams.get('menuId');
    const search = searchParams.get('search');
    const dietary = searchParams.getAll('dietary');

    // Build query filters
    const where: Prisma.MenuItemWhereInput = {
      isAvailable: true,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (menuId) {
      where.menuId = menuId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Handle dietary restrictions if provided
    if (dietary.length > 0) {
      dietary.forEach((diet) => {
        switch (diet) {
          case "vegetarian":
            where.isVegetarian = true;
            break;
          case "vegan":
            where.isVegan = true;
            break;
          case "pescatarian":
            where.isPescatarian = true;
            break;
          case "gluten-free":
            where.isGlutenFree = true;
            break;
          case "dairy-free":
            where.isDairyFree = true;
            break;
          case "nut-free":
            where.isNutFree = true;
            break;
        }
      });
    }

    const menuItems = await prisma.menuItem.findMany({
      where,
      include: {
        category: true,
        menu: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        category: {
          name: "asc",
        },
      },
    });

    return NextResponse.json(menuItems);
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