'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { Decimal } from "@prisma/client/runtime/library";
import { PromotionType } from "@prisma/client";

type PromotionFormData = {
  name: string;
  description?: string | null;
  promotionType: string;
  value: number;
  minimumOrderValue?: number | null;
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
  freeItemId?: string | null;
  couponCode?: string | null;
  usageLimit?: number | null;
  applyToAllItems: boolean;
  menuItemIds?: string[];
  categoryIds?: string[];
};

export async function getPromotions() {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        freeItem: true,
        _count: {
          select: {
            menuItems: true,
            categories: true,
            appliedOrders: true,
          }
        }
      }
    });
    
    // Use JSON serialization to convert all Decimal objects to plain numbers
    const jsonString = JSON.stringify(
      promotions,
      (key, value) => 
        typeof value === 'object' && value !== null && typeof value.toNumber === 'function' 
          ? value.toNumber() 
          : value
    );
    
    const serializedPromotions = JSON.parse(jsonString);
    
    return { promotions: serializedPromotions };
  } catch (error) {
    console.error("Error fetching promotions:", error);
    return { error: "Failed to fetch promotions" };
  }
}

export async function getPromotion(id: string) {
  try {
    const promotion = await prisma.promotion.findUnique({
      where: { id },
      include: {
        freeItem: true,
        menuItems: { select: { id: true, name: true, price: true } },
        categories: { select: { id: true, name: true } },
      }
    });
    
    if (!promotion) {
      return { error: "Promotion not found" };
    }
    
    // Use JSON serialization to convert all Decimal objects to plain numbers
    const jsonString = JSON.stringify(
      promotion,
      (key, value) => 
        typeof value === 'object' && value !== null && typeof value.toNumber === 'function' 
          ? value.toNumber() 
          : value
    );
    
    const serializedPromotion = JSON.parse(jsonString);
    
    return { promotion: serializedPromotion };
  } catch (error) {
    console.error("Error fetching promotion:", error);
    return { error: "Failed to fetch promotion" };
  }
}

export async function createPromotion(data: PromotionFormData) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return { error: "Unauthorized" };
    }
    
    // Validate form data
    if (!data.name || !data.promotionType || !data.value || !data.startDate || !data.endDate) {
      return { error: "Required fields are missing" };
    }
    
    // Create promotion
    const promotion = await prisma.promotion.create({
      data: {
        name: data.name,
        description: data.description,
        promotionType: data.promotionType as PromotionType, // Cast to PromotionType enum
        value: new Decimal(data.value),
        minimumOrderValue: data.minimumOrderValue ? new Decimal(data.minimumOrderValue) : null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive,
        freeItemId: data.freeItemId,
        couponCode: data.couponCode,
        usageLimit: data.usageLimit,
        applyToAllItems: data.applyToAllItems,
        menuItems: data.menuItemIds?.length ? {
          connect: data.menuItemIds.map(id => ({ id }))
        } : undefined,
        categories: data.categoryIds?.length ? {
          connect: data.categoryIds.map(id => ({ id }))
        } : undefined,
      }
    });
    
    // Serialize the promotion data to make it safe for passing to the client
    const serializedPromotion = {
      ...promotion,
      value: promotion.value ? promotion.value.toNumber() : null,
      minimumOrderValue: promotion.minimumOrderValue ? promotion.minimumOrderValue.toNumber() : null,
    };
    
    revalidatePath('/admin/menu');
    return { success: true, promotion: serializedPromotion };
  } catch (error) {
    console.error("Error creating promotion:", error);
    return { error: "Failed to create promotion" };
  }
}

export async function updatePromotion(id: string, data: PromotionFormData) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return { error: "Unauthorized" };
    }
    
    // Validate form data
    if (!data.name || !data.promotionType || !data.value || !data.startDate || !data.endDate) {
      return { error: "Required fields are missing" };
    }
    
    // Check if promotion exists
    const existingPromotion = await prisma.promotion.findUnique({
      where: { id },
      include: { menuItems: true, categories: true }
    });
    
    if (!existingPromotion) {
      return { error: "Promotion not found" };
    }
    
    // Update promotion
    const promotion = await prisma.promotion.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        promotionType: data.promotionType as PromotionType,
        value: new Decimal(data.value),
        minimumOrderValue: data.minimumOrderValue ? new Decimal(data.minimumOrderValue) : null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive,
        freeItemId: data.freeItemId,
        couponCode: data.couponCode,
        usageLimit: data.usageLimit,
        applyToAllItems: data.applyToAllItems,
        menuItems: {
          disconnect: existingPromotion.menuItems.map(item => ({ id: item.id })),
          ...(data.menuItemIds?.length ? { connect: data.menuItemIds.map(id => ({ id })) } : {})
        },
        categories: {
          disconnect: existingPromotion.categories.map(cat => ({ id: cat.id })),
          ...(data.categoryIds?.length ? { connect: data.categoryIds.map(id => ({ id })) } : {})
        }
      }
    });
    
    // Serialize the promotion data to make it safe for passing to the client
    const serializedPromotion = {
      ...promotion,
      value: promotion.value ? promotion.value.toNumber() : null,
      minimumOrderValue: promotion.minimumOrderValue ? promotion.minimumOrderValue.toNumber() : null,
    };
    
    revalidatePath('/admin/menu');
    return { success: true, promotion: serializedPromotion };
  } catch (error) {
    console.error("Error updating promotion:", error);
    return { error: "Failed to update promotion" };
  }
}

export async function deletePromotion(id: string) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")) {
      return { error: "Unauthorized" };
    }
    
    // Check if the promotion exists
    const promotion = await prisma.promotion.findUnique({ where: { id } });
    if (!promotion) {
      return { error: "Promotion not found" };
    }
    
    // Delete the promotion
    await prisma.promotion.delete({ where: { id } });
    
    revalidatePath('/admin/menu');
    return { success: true };
  } catch (error) {
    console.error("Error deleting promotion:", error);
    return { error: "Failed to delete promotion" };
  }
}