"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

// Get all menus
export async function getMenus() {
  try {
    const menus = await prisma.menu.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return { menus };
  } catch (error) {
    console.error("Error fetching menus:", error);
    return { error: "Failed to fetch menus" };
  }
}

// Get active menu
export async function getActiveMenu() {
  try {
    const menu = await prisma.menu.findFirst({
      where: {
        isActive: true
      }
    });
    
    if (!menu) {
      return { error: "No active menu found" };
    }
    
    return { menu };
  } catch (error) {
    console.error("Error fetching active menu:", error);
    return { error: "Failed to fetch active menu" };
  }
}

// Create a new menu
export async function createMenu({
  name,
  description,
  isActive,
  isPickup,
}: {
  name: string;
  description?: string;
  isActive?: boolean;
  isPickup?: boolean;
}) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session) {
      return { error: "Unauthorized" };
    }
    
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { error: "Forbidden" };
    }

    // Validate input
    if (!name) {
      return { error: "Menu name is required" };
    }
    
    // If setting as active, deactivate current active menu
    if (isActive) {
      await prisma.menu.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }
    
    // Create the menu
    const menu = await prisma.menu.create({
      data: {
        name,
        description: description || undefined,
        isActive: isActive || false,
        isPickup: isPickup !== undefined ? isPickup : true,
      }
    });
    
    // Revalidate the menu list page
    revalidatePath('/admin/menu');
    
    return { menu };
  } catch (error) {
    console.error("Error creating menu:", error);
    return { error: "Failed to create menu" };
  }
}

// Update menu
export async function updateMenu(
  id: string,
  {
    name,
    description,
    isActive,
    isPickup,
  }: {
    name?: string;
    description?: string | null;
    isActive?: boolean;
    isPickup?: boolean;
  }
) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session) {
      return { error: "Unauthorized" };
    }
    
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { error: "Forbidden" };
    }
    
    // Check if menu exists
    const existingMenu = await prisma.menu.findUnique({
      where: { id }
    });
    
    if (!existingMenu) {
      return { error: "Menu not found" };
    }
    
    // If setting as active, deactivate current active menu
    if (isActive) {
      await prisma.menu.updateMany({
        where: { 
          isActive: true,
          id: { not: id }
        },
        data: { isActive: false }
      });
    }
    
    // Update menu
    const menu = await prisma.menu.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
        isPickup: isPickup !== undefined ? isPickup : undefined,
      }
    });
    
    // Revalidate the menu list page
    revalidatePath('/admin/menu');
    
    return { menu };
  } catch (error) {
    console.error("Error updating menu:", error);
    return { error: "Failed to update menu" };
  }
}

// Delete menu
export async function deleteMenu(id: string) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session) {
      return { error: "Unauthorized" };
    }
    
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return { error: "Forbidden" };
    }
    
    // Check if menu exists
    const existingMenu = await prisma.menu.findUnique({
      where: { id }
    });
    
    if (!existingMenu) {
      return { error: "Menu not found" };
    }
    
    // Check for items linked to this menu
    const itemsCount = await prisma.menuItem.count({
      where: { menuId: id }
    });
    
    if (itemsCount > 0) {
      return { 
        error: "Cannot delete menu with items. Please delete all items first or reassign them." 
      };
    }
    
    // Delete menu
    await prisma.menu.delete({
      where: { id }
    });
    
    // Revalidate the menu list page
    revalidatePath('/admin/menu');
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting menu:", error);
    return { error: "Failed to delete menu" };
  }
} 