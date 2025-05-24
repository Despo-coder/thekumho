"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, Users, DollarSign, Target, Calendar, BarChart3 } from "lucide-react";

type PromotionUsage = {
    id: string;
    promotionId: string;
    promotion: {
        id: string;
        name: string;
        promotionType: string;
        couponCode: string | null;
    };
    discountAmount: number;
    originalAmount: number;
    finalAmount: number;
    customerSegment: string | null;
    orderType: string | null;
    isFirstTimeUse: boolean;
    createdAt: string;
};

type AnalyticsData = {
    totalUsages: number;
    totalRevenue: number;
    totalDiscounts: number;
    averageOrderValue: number;
    topPromotions: Array<{
        promotionId: string;
        name: string;
        usageCount: number;
        totalDiscount: number;
        revenueImpact: number;
    }>;
    customerSegments: Array<{
        segment: string;
        count: number;
        percentage: number;
    }>;
    recentUsages: PromotionUsage[];
};

export default function PromotionAnalytics() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState('30'); // Default to last 30 days

    const fetchAnalytics = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/analytics/promotions?days=${dateRange}`);

            if (!response.ok) {
                throw new Error('Failed to fetch analytics data');
            }

            const data = await response.json();
            setAnalytics(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching promotion analytics:', err);
            setError('Failed to load analytics data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
                    <p className="mt-2 text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error || 'No analytics data available'}</p>
                <Button onClick={fetchAnalytics} variant="outline">
                    Try Again
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Date Range Selector */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Analytics Overview</h3>
                <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                        <option value="7">Last 7 days</option>
                        <option value="30">Last 30 days</option>
                        <option value="90">Last 90 days</option>
                        <option value="365">Last year</option>
                    </select>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Uses</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{analytics.totalUsages}</div>
                        <p className="text-xs text-muted-foreground">
                            Promotion applications
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue Impact</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${analytics.totalRevenue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            Total order value with promotions
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            ${analytics.totalDiscounts.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Amount discounted
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${analytics.averageOrderValue.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">
                            With promotions applied
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Top Performing Promotions */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performing Promotions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analytics.topPromotions.length > 0 ? (
                            analytics.topPromotions.map((promo, index) => (
                                <div key={promo.promotionId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                            <span className="text-sm font-bold text-orange-600">#{index + 1}</span>
                                        </div>
                                        <div>
                                            <p className="font-medium">{promo.name}</p>
                                            <p className="text-sm text-gray-600">{promo.usageCount} uses</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium">${promo.revenueImpact.toFixed(2)}</p>
                                        <p className="text-sm text-gray-600">Revenue impact</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-4">No promotion data available for this period</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Customer Segments */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Customer Segments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.customerSegments.map((segment) => (
                                <div key={segment.segment} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <Users className="h-4 w-4 text-gray-500" />
                                        <span className="capitalize">{segment.segment || 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm font-medium">{segment.count}</span>
                                        <span className="text-xs text-gray-500">({segment.percentage.toFixed(1)}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Usage */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {analytics.recentUsages.length > 0 ? (
                                analytics.recentUsages.slice(0, 5).map((usage) => (
                                    <div key={usage.id} className="flex items-center justify-between p-2 border-l-2 border-orange-200 pl-3">
                                        <div>
                                            <p className="text-sm font-medium">{usage.promotion.name}</p>
                                            <p className="text-xs text-gray-500">
                                                {usage.promotion.couponCode ? `Code: ${usage.promotion.couponCode}` : 'No code'}
                                                {usage.isFirstTimeUse && ' • First time user'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-orange-600">-${usage.discountAmount.toFixed(2)}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(usage.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-4">No recent usage data</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 