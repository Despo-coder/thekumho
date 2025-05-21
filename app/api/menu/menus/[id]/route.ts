import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth";

export interface MenuParams {
  params: Promise<{ id: string }>;
}

// GET /api/menu/menus/[id] - Get menu details
export async function GET(
  request: NextRequest,
  { params }: MenuParams
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const menu = await prisma.menu.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            items: true
          }
        }
      }
    });

    if (!menu) {
      return NextResponse.json(
        { error: "Menu not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(menu);
  } catch (error) {
    console.error("Error fetching menu:", error);
    return NextResponse.json(
      { error: "Failed to fetch menu" },
      { status: 500 }
    );
  }
} 