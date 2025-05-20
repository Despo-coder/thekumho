import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/auth";

export async function POST(req: Request) {
  try {
    //const session = await getServerSession(authOptions);
    const body = await req.json();
    const { 
      customerName, 
      email, 
      phone, 
      partySize, 
      bookingTime, 
      specialRequest,
      userId 
    } = body;

    // Basic validation
    if (!customerName || !email || !phone || !partySize || !bookingTime) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find available table that can accommodate the party size
    const availableTables = await prisma.table.findMany({
      where: {
        seats: {
          gte: partySize
        },
        // Exclude tables that are already booked at the requested time
        NOT: {
          bookings: {
            some: {
              bookingTime: {
                equals: new Date(bookingTime)
              },
              status: {
                not: "cancelled"
              }
            }
          }
        }
      },
      orderBy: {
        seats: 'asc' // Get the smallest table that fits
      },
      take: 1 // We only need one table
    });

    if (availableTables.length === 0) {
      return NextResponse.json(
        { message: "No tables available for the selected time and party size" },
        { status: 400 }
      );
    }

    // Create the booking with the available table
    const booking = await prisma.booking.create({
      data: {
        customerName,
        email,
        phone,
        partySize,
        bookingTime: new Date(bookingTime),
        specialRequest,
        status: "pending",
        tableId: availableTables[0].id,
        userId: userId || undefined, // Link to user if signed in
      },
      include: {
        table: true
      }
    });

    return NextResponse.json(
      { 
        booking,
        message: "Booking created successfully" 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating booking:", error);
    return NextResponse.json(
      { message: "An error occurred creating the booking" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    // Only allow users to see their own bookings unless admin
    if (userId && session?.user.id !== userId && session?.user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }
    
    const bookings = await prisma.booking.findMany({
      where: userId ? { userId } : {},
      include: {
        table: true
      },
      orderBy: {
        bookingTime: 'desc'
      }
    });
    
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { message: "An error occurred fetching bookings" },
      { status: 500 }
    );
  }
} 