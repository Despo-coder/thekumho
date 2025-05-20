import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

// Define interfaces for query parameters
type SalesQuery = Prisma.SaleWhereInput;

// GET /api/sales - Get all sales (admin/staff only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization (staff only)
    if (!["ADMIN", "MANAGER", "WAITER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const serverId = searchParams.get("serverId");
    const paymentMethod = searchParams.get("paymentMethod");

    // Build query
    const query: SalesQuery = {};
    
    if (startDate && endDate) {
      query.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      query.createdAt = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      query.createdAt = {
        lte: new Date(endDate),
      };
    }
    
    if (serverId) {
      query.serverId = serverId;
    }
    
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Fetch sales
    const sales = await prisma.sale.findMany({
      where: query,
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales" },
      { status: 500 }
    );
  }
}

// POST /api/sales - Create a new sale (admin/staff only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    // Check authentication
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization (staff only)
    if (!["ADMIN", "MANAGER", "WAITER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate required fields
    const { subtotal, tax, total, paymentMethod } = body;
    
    if (!subtotal || !tax || !total || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate sale number (could be more sophisticated in production)
    const saleNumber = "S-" + Date.now().toString().slice(-6);

    // Create sale
    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        subtotal,
        tax,
        total,
        paymentMethod,
        tip: body.tip || null,
        discount: body.discount || null,
        orderId: body.orderId || null,
        serverId: body.serverId || null,
        processedById: session.user.id, // The logged-in staff member
        notes: body.notes || null,
      },
    });

    // If this sale is associated with an order, update the order payment status
    if (body.orderId) {
      await prisma.order.update({
        where: { id: body.orderId },
        data: {
          paymentStatus: "PAID",
          // You could also update other order fields here
        },
      });
    }

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Error creating sale:", error);
    return NextResponse.json(
      { error: "Failed to create sale" },
      { status: 500 }
    );
  }
} 