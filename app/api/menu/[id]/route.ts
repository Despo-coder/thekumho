import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface MenuItemParams {
  params: Promise<{ id: string }>;
}

// GET /api/menu/[id] - Get a specific menu item
export async function GET(
  request: Request,
  { params }: MenuItemParams
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    const menuItem = await prisma.menuItem.findUnique({
      where: {
        id,
      },
      include: {
        category: true,
        menu: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!menuItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(menuItem);
  } catch (error) {
    console.error("Error fetching menu item:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu item" },
      { status: 500 }
    );
  }
}

// PUT /api/menu/[id] - Update a menu item (admin only)
export async function PUT(
  request: NextRequest,
  { params }: MenuItemParams
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    // Check authentication and authorization
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if menu item exists
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    // Update menu item
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(menuItem);
  } catch (error) {
    console.error("Error updating menu item:", error);
    return NextResponse.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

// DELETE /api/menu/[id] - Delete a menu item (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: MenuItemParams
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Check authentication and authorization
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if menu item exists
    const existingItem = await prisma.menuItem.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Menu item not found" },
        { status: 404 }
      );
    }

    // Delete menu item
    await prisma.menuItem.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Menu item deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting menu item:", error);
    return NextResponse.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
} 