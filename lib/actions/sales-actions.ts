'use server'

import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';
import { nanoid } from 'nanoid';

type CreateSaleParams = {
  subtotal: number;
  tax: number;
  tip?: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  orderId: string;
  processedById: string;
  notes?: string;
  serverId?: string;
}

type SaleResult = {
  success: boolean;
  saleId?: string;
  error?: string;
}

/**
 * Creates a sales record from a successful payment
 */
export async function createSaleFromPayment(params: CreateSaleParams): Promise<SaleResult> {
  try {
    // Generate a sale number
    const timestamp = new Date().getTime().toString().slice(-6);
    const randomChars = nanoid(4).toUpperCase();
    const saleNumber = `SALE-${timestamp}-${randomChars}`;
    
    // Create the sale record
    const sale = await prisma.sale.create({
      data: {
        saleNumber,
        subtotal: params.subtotal,
        tax: params.tax,
        tip: params.tip || 0,
        discount: params.discount || 0,
        total: params.total,
        paymentMethod: params.paymentMethod,
        paymentStatus: PaymentStatus.PAID,
        orderId: params.orderId,
        serverId: params.serverId || null,
        processedById: params.processedById,
        notes: params.notes || null
      }
    });
    
    console.log(`Created sale record ${sale.id} for order ${params.orderId}`);
    
    return {
      success: true,
      saleId: sale.id
    };
  } catch (error) {
    console.error('Error creating sale record:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create sale record'
    };
  }
}

/**
 * Gets sales data for reporting
 */
export async function getSalesData(dateRange?: { from: Date; to: Date }) {
  try {
    const where = dateRange ? {
      createdAt: {
        gte: dateRange.from,
        lte: dateRange.to
      }
    } : {};
    
    const sales = await prisma.sale.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        order: {
          select: {
            orderNumber: true,
            orderType: true
          }
        }
      }
    });
    
    // Calculate totals
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalTax = sales.reduce((sum, sale) => sum + Number(sale.tax), 0);
    const totalTips = sales.reduce((sum, sale) => sum + Number(sale.tip || 0), 0);
    
    return {
      success: true,
      sales,
      summary: {
        totalSales,
        totalRevenue,
        totalTax,
        totalTips
      }
    };
  } catch (error) {
    console.error('Error fetching sales data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales data'
    };
  }
} 