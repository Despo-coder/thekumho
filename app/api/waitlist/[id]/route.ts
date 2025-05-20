import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface WaitlistParams {
  params: Promise<{ id: string }>;
}

// GET /api/waitlist/[id] - Get a specific waitlist entry
export async function GET(
  request: NextRequest,
  context: WaitlistParams
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    // Check authentication
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch waitlist entry
    const waitlistEntry = await prisma.waitlist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        bookings: true,
      },
    });

    // Check if entry exists
    if (!waitlistEntry) {
      return NextResponse.json(
        { error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    // Check authorization (customer can only see their own entries)
    if (
      session.user.role === "USER" &&
      waitlistEntry.userId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(waitlistEntry);
  } catch (error) {
    console.error("Error fetching waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist entry" },
      { status: 500 }
    );
  }
}

// PATCH /api/waitlist/[id] - Update a waitlist entry (admin/staff only)
export async function PATCH(
  request: NextRequest,
  context: WaitlistParams
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

    // Check authorization (staff only)
    if (!["ADMIN", "MANAGER", "WAITER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if entry exists
    const existingEntry = await prisma.waitlist.findUnique({
      where: { id },
    });

    if (!existingEntry) {
      return NextResponse.json(
        { error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    // Update the entry
    const updatedEntry = await prisma.waitlist.update({
      where: { id },
      data: {
        status: body.status,
        estimatedWait: body.estimatedWait,
        notificationSent: body.notificationSent,
        notes: body.notes,
      },
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error("Error updating waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to update waitlist entry" },
      { status: 500 }
    );
  }
}

// DELETE /api/waitlist/[id] - Delete a waitlist entry (admin/staff only)
export async function DELETE(
  request: NextRequest,
  context: WaitlistParams
) {
  try {
    const session = await getServerSession(authOptions);
    const resolvedParams = await context.params;
    const { id } = resolvedParams;

    // Check authentication
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check authorization (staff only or the customer who created it)
    const entry = await prisma.waitlist.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!entry) {
      return NextResponse.json(
        { error: "Waitlist entry not found" },
        { status: 404 }
      );
    }

    const isStaff = ["ADMIN", "MANAGER", "WAITER"].includes(session.user.role);
    const isOwner = entry.userId === session.user.id;

    if (!isStaff && !isOwner) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete the entry
    await prisma.waitlist.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Waitlist entry deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to delete waitlist entry" },
      { status: 500 }
    );
  }
} 