import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface CategoryParams {
  params: Promise<{ id: string }>;
}

// GET /api/categories/[id] - Get category details
export async function GET(
  request: NextRequest,
  { params }: CategoryParams
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        items: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: CategoryParams
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

    // Validate input
    if (!body.name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    // Check if category with the same name already exists (and it's not the current one)
    const existingCategory = await prisma.category.findFirst({
      where: { 
        name: body.name,
        id: { not: id }
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Another category with this name already exists" },
        { status: 409 }
      );
    }

    // Update the category
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description !== undefined ? body.description : undefined,
      },
    });

    return NextResponse.json(updatedCategory);
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: CategoryParams
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

    // Check if category has menu items
    const itemCount = await prisma.menuItem.count({
      where: { categoryId: id }
    });

    if (itemCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with items. Please delete or move all items first." },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Category deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
} 