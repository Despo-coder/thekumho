"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Define enum since it's not exported from Prisma
enum BookingStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed", 
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

// Type definitions for bookings
type BookingWithCustomer = {
  id: number;
  customerName: string;
  email: string | null;
  phone: string | null;
  partySize: number;
  bookingTime: Date;
  status: string;
  specialRequest: string | null;
  tableId: number | null;
  createdAt: Date;
};

type BookingStats = {
  totalBookings: number;
  todayBookings: number;
  upcomingBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
};

type BookingResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Authentication helper
async function requireAuth(allowedRoles: string[] = ["ADMIN", "MANAGER", "WAITER"]) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    throw new Error("Unauthorized access");
  }
  
  return session;
}

// Get booking statistics for dashboard
export async function getBookingStats(): Promise<BookingResult<BookingStats>> {
  try {
    await requireAuth();

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    const now = new Date();

    const [
      totalBookings,
      todayBookings,
      upcomingBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings
    ] = await Promise.all([
      // Total bookings count
      prisma.booking.count(),
      
      // Today's bookings
      prisma.booking.count({
        where: {
          bookingTime: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      }),
      
      // Upcoming bookings (future bookings)
      prisma.booking.count({
        where: {
          bookingTime: {
            gte: now
          },
          status: {
            in: [BookingStatus.CONFIRMED, BookingStatus.PENDING]
          }
        }
      }),
      
      // Pending bookings
      prisma.booking.count({
        where: {
          status: BookingStatus.PENDING
        }
      }),
      
      // Confirmed bookings
      prisma.booking.count({
        where: {
          status: BookingStatus.CONFIRMED
        }
      }),
      
      // Completed bookings
      prisma.booking.count({
        where: {
          status: BookingStatus.COMPLETED
        }
      })
    ]);

    const stats: BookingStats = {
      totalBookings,
      todayBookings,
      upcomingBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings
    };

    return { success: true, data: stats };

  } catch (error) {
    console.error("Error fetching booking stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch booking statistics"
    };
  }
}

// Get bookings with filtering and pagination
export async function getBookings({
  page = 1,
  limit = 20,
  status,
  date,
  search
}: {
  page?: number;
  limit?: number;
  status?: string;
  date?: Date;
  search?: string;
} = {}): Promise<BookingResult<{
  bookings: BookingWithCustomer[];
  totalCount: number;
  totalPages: number;
}>> {
  try {
    await requireAuth();

    // Build where clause
    const where: Record<string, unknown> = {};
    
    if (status) {
      where.status = status;
    }
    
    if (date) {
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
      where.bookingTime = {
        gte: startOfDay,
        lt: endOfDay
      };
    }
    
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.booking.count({ where });
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Fetch bookings
    const bookings = await prisma.booking.findMany({
      where,
      orderBy: {
        bookingTime: 'asc'
      },
      skip,
      take: limit
    });

    // Transform data
    const transformedBookings: BookingWithCustomer[] = bookings.map(booking => ({
      id: booking.id,
      customerName: booking.customerName,
      email: booking.email,
      phone: booking.phone,
      partySize: booking.partySize,
      bookingTime: booking.bookingTime,
      status: booking.status,
      specialRequest: booking.specialRequest,
      tableId: booking.tableId,
      createdAt: booking.createdAt
    }));

    return {
      success: true,
      data: {
        bookings: transformedBookings,
        totalCount,
        totalPages
      }
    };

  } catch (error) {
    console.error("Error fetching bookings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch bookings"
    };
  }
}

// Update booking status
export async function updateBookingStatus(
  bookingId: number,
  newStatus: string,
  tableId?: number
): Promise<BookingResult<void>> {
  try {
    await requireAuth();

    const updateData: Record<string, unknown> = {
      status: newStatus
    };

    if (tableId !== undefined) {
      updateData.tableId = tableId;
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: updateData
    });

    // Revalidate the bookings page
    revalidatePath('/admin');

    return { success: true };

  } catch (error) {
    console.error("Error updating booking status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update booking status"
    };
  }
}

// Create a new booking (for walk-ins or phone reservations)
export async function createBooking({
  customerName,
  email,
  phone,
  partySize,
  bookingTime,
  specialRequest
}: {
  customerName: string;
  email?: string;
  phone?: string;
  partySize: number;
  bookingTime: Date;
  specialRequest?: string;
}): Promise<BookingResult<{ bookingId: number }>> {
  try {
    await requireAuth();

    const booking = await prisma.booking.create({
      data: {
        customerName,
        email: email || null,
        phone: phone || null,
        partySize,
        bookingTime,
        specialRequest: specialRequest || null,
        status: BookingStatus.PENDING
      }
    });

    revalidatePath('/admin');

    return {
      success: true,
      data: { bookingId: booking.id }
    };

  } catch (error) {
    console.error("Error creating booking:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create booking"
    };
  }
}

// Delete a booking
export async function deleteBooking(bookingId: number): Promise<BookingResult<void>> {
  try {
    await requireAuth(["ADMIN", "MANAGER"]);

    await prisma.booking.delete({
      where: { id: bookingId }
    });

    revalidatePath('/admin');

    return { success: true };

  } catch (error) {
    console.error("Error deleting booking:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete booking"
    };
  }
}

// Get today's bookings for quick access
export async function getTodayBookings(): Promise<BookingResult<BookingWithCustomer[]>> {
  try {
    await requireAuth();

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const bookings = await prisma.booking.findMany({
      where: {
        bookingTime: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      orderBy: {
        bookingTime: 'asc'
      }
    });

    const transformedBookings: BookingWithCustomer[] = bookings.map(booking => ({
      id: booking.id,
      customerName: booking.customerName,
      email: booking.email,
      phone: booking.phone,
      partySize: booking.partySize,
      bookingTime: booking.bookingTime,
      status: booking.status,
      specialRequest: booking.specialRequest,
      tableId: booking.tableId,
      createdAt: booking.createdAt
    }));

    return {
      success: true,
      data: transformedBookings
    };

  } catch (error) {
    console.error("Error fetching today's bookings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch today's bookings"
    };
  }
} 