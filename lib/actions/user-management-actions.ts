"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Role, UserStatus } from "@prisma/client";
import bcrypt from "bcrypt";

// Type definitions
type UserWithDetails = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  status: UserStatus;
  employeeId: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  hireDate: Date | null;
  lastLogin: Date | null;
  isActive: boolean;
  createdAt: Date;
  createdBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  _count?: {
    orders: number;
    auditLogs: number;
    sessions: number;
  };
};

type UserStats = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  managerUsers: number;
  chefUsers: number;
  waiterUsers: number;
  customerUsers: number;
  newUsersThisMonth: number;
};

type UserResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

type CreateUserData = {
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  employeeId?: string;
  phone?: string;
  hireDate?: Date;
  sendInvitation?: boolean;
};

type UpdateUserData = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: Role;
  status?: UserStatus;
  employeeId?: string;
  hireDate?: Date;
};

// Authentication helper
async function requireAuth(allowedRoles: Role[] = ["ADMIN", "MANAGER"]) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !allowedRoles.includes(session.user.role as Role)) {
    throw new Error("Unauthorized access");
  }
  
  return session;
}

// Audit logging helper
async function logUserAction(
  userId: string,
  action: string,
  performedById: string,
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.userAuditLog.create({
      data: {
        userId,
        action,
        performedById,
        details: details ? JSON.stringify(details) : undefined,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to log user action:", error);
    // Don't throw error to avoid breaking the main operation
  }
}

// Get user management statistics
export async function getUserStats(): Promise<UserResult<UserStats>> {
  try {
    await requireAuth();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      adminUsers,
      managerUsers,
      chefUsers,
      waiterUsers,
      customerUsers,
      newUsersThisMonth,
    ] = await Promise.all([
      // Total users (excluding customers for staff dashboard)
      prisma.user.count({
        where: {
          role: {
            in: ["ADMIN", "MANAGER", "CHEF", "WAITER"]
          }
        }
      }),
      
      // Active staff users
      prisma.user.count({
        where: {
          status: "ACTIVE",
          role: {
            in: ["ADMIN", "MANAGER", "CHEF", "WAITER"]
          }
        }
      }),
      
      // Inactive staff users
      prisma.user.count({
        where: {
          status: "INACTIVE",
          role: {
            in: ["ADMIN", "MANAGER", "CHEF", "WAITER"]
          }
        }
      }),
      
      // Suspended staff users
      prisma.user.count({
        where: {
          status: "SUSPENDED",
          role: {
            in: ["ADMIN", "MANAGER", "CHEF", "WAITER"]
          }
        }
      }),
      
      // Role-specific counts
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.user.count({ where: { role: "MANAGER" } }),
      prisma.user.count({ where: { role: "CHEF" } }),
      prisma.user.count({ where: { role: "WAITER" } }),
      prisma.user.count({ where: { role: "USER" } }),
      
      // New users this month
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfMonth
          },
          role: {
            in: ["ADMIN", "MANAGER", "CHEF", "WAITER"]
          }
        }
      }),
    ]);

    const stats: UserStats = {
      totalUsers,
      activeUsers,
      inactiveUsers,
      suspendedUsers,
      adminUsers,
      managerUsers,
      chefUsers,
      waiterUsers,
      customerUsers,
      newUsersThisMonth,
    };

    return { success: true, data: stats };

  } catch (error) {
    console.error("Error fetching user stats:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch user statistics"
    };
  }
}

// Get users with filtering and pagination
export async function getUsers({
  page = 1,
  limit = 20,
  role,
  status,
  search,
  includeCustomers = false
}: {
  page?: number;
  limit?: number;
  role?: Role;
  status?: UserStatus;
  search?: string;
  includeCustomers?: boolean;
} = {}): Promise<UserResult<{
  users: UserWithDetails[];
  totalCount: number;
  totalPages: number;
}>> {
  try {
    await requireAuth();

    // Build where clause
    const where: Record<string, unknown> = {};
    
    // Filter out customers by default unless specifically requested
    if (!includeCustomers) {
      where.role = {
        in: ["ADMIN", "MANAGER", "CHEF", "WAITER"]
      };
    }
    
    if (role) {
      where.role = role;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count for pagination
    const totalCount = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalCount / limit);
    const skip = (page - 1) * limit;

    // Fetch users with related data
    const users = await prisma.user.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            orders: true,
            auditLogs: true,
            sessions: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    // Transform data for type safety
    const transformedUsers: UserWithDetails[] = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      hireDate: user.hireDate,
      lastLogin: user.lastLogin,
      isActive: user.isActive,
      createdAt: user.createdAt,
      createdBy: user.createdBy,
      _count: user._count,
    }));

    return {
      success: true,
      data: {
        users: transformedUsers,
        totalCount,
        totalPages
      }
    };

  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch users"
    };
  }
}

// Create a new user
export async function createUser(
  userData: CreateUserData,
  ipAddress?: string,
  userAgent?: string
): Promise<UserResult<{ userId: string }>> {
  try {
    const session = await requireAuth();

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email }
    });

    if (existingUser) {
      return {
        success: false,
        error: "A user with this email already exists"
      };
    }

    // Check if employeeId already exists (if provided)
    if (userData.employeeId) {
      const existingEmployee = await prisma.user.findUnique({
        where: { employeeId: userData.employeeId }
      });

      if (existingEmployee) {
        return {
          success: false,
          error: "A user with this employee ID already exists"
        };
      }
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create the user
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        name: `${userData.firstName} ${userData.lastName}`,
        role: userData.role,
        employeeId: userData.employeeId,
        phone: userData.phone,
        hireDate: userData.hireDate,
        password: hashedPassword,
        status: "ACTIVE",
        createdById: session.user.id,
      }
    });

    // Log the action
    await logUserAction(
      newUser.id,
      "CREATE",
      session.user.id,
      {
        role: userData.role,
        employeeId: userData.employeeId,
        tempPassword: userData.sendInvitation ? tempPassword : undefined,
      },
      ipAddress,
      userAgent
    );

    // TODO: Send invitation email if requested
    if (userData.sendInvitation) {
      // This would integrate with your email service
      console.log(`Send invitation email to ${userData.email} with temp password: ${tempPassword}`);
    }

    revalidatePath('/admin');

    return {
      success: true,
      data: { userId: newUser.id }
    };

  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user"
    };
  }
}

// Update a user
export async function updateUser(
  userId: string,
  userData: UpdateUserData,
  ipAddress?: string,
  userAgent?: string
): Promise<UserResult<void>> {
  try {
    const session = await requireAuth();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return {
        success: false,
        error: "User not found"
      };
    }

    // Check if employeeId already exists (if being updated)
    if (userData.employeeId && userData.employeeId !== existingUser.employeeId) {
      const existingEmployee = await prisma.user.findUnique({
        where: { employeeId: userData.employeeId }
      });

      if (existingEmployee) {
        return {
          success: false,
          error: "A user with this employee ID already exists"
        };
      }
    }

    // Prepare update data
    const updateData: UpdateUserData & { name?: string } = { ...userData };
    
    // Update name if first or last name changed
    if (userData.firstName || userData.lastName) {
      const firstName = userData.firstName || existingUser.firstName || "";
      const lastName = userData.lastName || existingUser.lastName || "";
      updateData.name = `${firstName} ${lastName}`.trim();
    }

    // Update the user
    await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Log the action
    await logUserAction(
      userId,
      "UPDATE",
      session.user.id,
      {
        changes: userData,
        previousRole: existingUser.role,
        newRole: userData.role,
      },
      ipAddress,
      userAgent
    );

    revalidatePath('/admin');

    return { success: true };

  } catch (error) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user"
    };
  }
}

// Deactivate a user (soft delete)
export async function deactivateUser(
  userId: string,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<UserResult<void>> {
  try {
    const session = await requireAuth(["ADMIN"]);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return {
        success: false,
        error: "User not found"
      };
    }

    // Prevent self-deactivation
    if (userId === session.user.id) {
      return {
        success: false,
        error: "You cannot deactivate your own account"
      };
    }

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "INACTIVE",
        isActive: false,
      }
    });

    // Log the action
    await logUserAction(
      userId,
      "DEACTIVATE",
      session.user.id,
      {
        reason,
        previousStatus: existingUser.status,
      },
      ipAddress,
      userAgent
    );

    revalidatePath('/admin');

    return { success: true };

  } catch (error) {
    console.error("Error deactivating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to deactivate user"
    };
  }
}

// Reactivate a user
export async function reactivateUser(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<UserResult<void>> {
  try {
    const session = await requireAuth(["ADMIN"]);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return {
        success: false,
        error: "User not found"
      };
    }

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: "ACTIVE",
        isActive: true,
      }
    });

    // Log the action
    await logUserAction(
      userId,
      "REACTIVATE",
      session.user.id,
      {
        previousStatus: existingUser.status,
      },
      ipAddress,
      userAgent
    );

    revalidatePath('/admin');

    return { success: true };

  } catch (error) {
    console.error("Error reactivating user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reactivate user"
    };
  }
}

// Reset user password
export async function resetUserPassword(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<UserResult<{ tempPassword: string }>> {
  try {
    const session = await requireAuth();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return {
        success: false,
        error: "User not found"
      };
    }

    // Generate new temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      }
    });

    // Log the action
    await logUserAction(
      userId,
      "PASSWORD_RESET",
      session.user.id,
      {
        resetBy: session.user.email,
      },
      ipAddress,
      userAgent
    );

    // TODO: Send password reset email
    console.log(`Send password reset email to ${existingUser.email} with temp password: ${tempPassword}`);

    return {
      success: true,
      data: { tempPassword }
    };

  } catch (error) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reset password"
    };
  }
}

// Get user audit log
export async function getUserAuditLog(
  userId: string,
  page: number = 1,
  limit: number = 20
): Promise<UserResult<{
  logs: Array<{
    id: string;
    action: string;
    details: Record<string, unknown> | null;
    performedBy: {
      id: string;
      name: string | null;
      email: string;
    };
    ipAddress: string | null;
    createdAt: Date;
  }>;
  totalCount: number;
  totalPages: number;
}>> {
  try {
    await requireAuth();

    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      prisma.userAuditLog.findMany({
        where: { userId },
        include: {
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.userAuditLog.count({ where: { userId } })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    const transformedLogs = logs.map(log => ({
      id: log.id,
      action: log.action,
      details: log.details ? JSON.parse(log.details as string) : null,
      performedBy: log.performedBy,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt,
    }));

    return {
      success: true,
      data: {
        logs: transformedLogs,
        totalCount,
        totalPages
      }
    };

  } catch (error) {
    console.error("Error fetching user audit log:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch audit log"
    };
  }
} 