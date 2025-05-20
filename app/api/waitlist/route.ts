import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma, WaitlistStatus } from "@prisma/client";

// Define interfaces for waitlist queries and data
type WaitlistQuery = Prisma.WaitlistWhereInput;

interface WaitlistCreateData {
  customerName: string;
  phoneNumber: string;
  partySize: number;
  requestedDate: Date;
  requestedTime: Date;
  email?: string | null;
  estimatedWait?: number | null;
  notes?: string | null;
  userId?: string;
}

// GET /api/waitlist - get all waitlist entries (admin/staff only)
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
    const status = searchParams.get("status");
    const date = searchParams.get("date");

    // Build query
    const query: WaitlistQuery = {};
    
    if (status) {
      query.status = status as WaitlistStatus;
    }
    
    if (date) {
      const requestedDate = new Date(date);
      query.requestedDate = {
        gte: requestedDate,
        lt: new Date(requestedDate.getTime() + 24 * 60 * 60 * 1000),
      };
    }

    // Fetch waitlist entries
    const waitlistEntries = await prisma.waitlist.findMany({
      where: query,
      orderBy: [
        { requestedDate: "asc" },
        { requestedTime: "asc" },
      ],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json(waitlistEntries);
  } catch (error) {
    console.error("Error fetching waitlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
      { status: 500 }
    );
  }
}

// POST /api/waitlist - Add a new waitlist entry
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    // Validate required fields
    const { customerName, phoneNumber, partySize, requestedDate, requestedTime } = body;
    
    if (!customerName || !phoneNumber || !partySize || !requestedDate || !requestedTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create data object
    const data: WaitlistCreateData = {
      customerName,
      phoneNumber,
      partySize,
      requestedDate: new Date(requestedDate),
      requestedTime: new Date(requestedTime),
      email: body.email || null,
      estimatedWait: body.estimatedWait || null,
      notes: body.notes || null,
    };

    // If user is authenticated, link to their account
    if (session?.user) {
      data.userId = session.user.id;
    }

    // Create waitlist entry
    const waitlistEntry = await prisma.waitlist.create({
      data,
    });

    return NextResponse.json(waitlistEntry, { status: 201 });
  } catch (error) {
    console.error("Error creating waitlist entry:", error);
    return NextResponse.json(
      { error: "Failed to create waitlist entry" },
      { status: 500 }
    );
  }
} 