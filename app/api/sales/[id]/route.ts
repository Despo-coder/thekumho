import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface SalesParams {
  params: Promise<{ id: string }>;
}

// GET /api/sales/[id] - Get a specific sale
export async function GET(
  request: NextRequest,
  context: SalesParams
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    // Check authentication
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization (staff only)
    if (!["ADMIN", "MANAGER", "WAITER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Fetch sale
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        order: true,
        server: {
          select: {
            id: true,
            name: true,
          },
        },
        processedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Check if sale exists
    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(sale);
  } catch (error) {
    console.error("Error fetching sale:", error);
    return NextResponse.json(
      { error: "Failed to fetch sale" },
      { status: 500 }
    );
  }
}

// PATCH /api/sales/[id] - Update a sale (admin only)
export async function PATCH(
  request: NextRequest,
  context: SalesParams
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await context.params;
    const { id } = resolvedParams;
    const body = await request.json();

    // Check authentication
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization (admin only)
    if (!["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if sale exists
    const existingSale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!existingSale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    // Update only allowed fields
    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        tip: body.tip !== undefined ? body.tip : undefined,
        discount: body.discount !== undefined ? body.discount : undefined,
        notes: body.notes !== undefined ? body.notes : undefined,
        // Don't allow changing core sale data like subtotal, tax, total
      },
    });

    return NextResponse.json(updatedSale);
  } catch (error) {
    console.error("Error updating sale:", error);
    return NextResponse.json(
      { error: "Failed to update sale" },
      { status: 500 }
    );
  }
}

// DELETE /api/sales/[id] - Void a sale (admin only)
export async function DELETE(
  request: NextRequest,
  context: SalesParams
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    // Check authentication
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization (admin only)
    if (!["ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if sale exists
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { order: true },
    });

    if (!sale) {
      return NextResponse.json(
        { error: "Sale not found" },
        { status: 404 }
      );
    }

    // We won't actually delete the sale, but mark it as refunded
    const voidedSale = await prisma.sale.update({
      where: { id },
      data: {
        paymentStatus: "REFUNDED",
        notes: `VOIDED: ${sale.notes || ""} - Voided by ${session.user.name} on ${new Date().toISOString()}`,
      },
    });

    // If this sale is associated with an order, update the order payment status
    if (sale.orderId) {
      await prisma.order.update({
        where: { id: sale.orderId },
        data: {
          paymentStatus: "REFUNDED",
        },
      });
    }

    return NextResponse.json(
      { message: "Sale voided successfully", sale: voidedSale },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error voiding sale:", error);
    return NextResponse.json(
      { error: "Failed to void sale" },
      { status: 500 }
    );
  }
} 