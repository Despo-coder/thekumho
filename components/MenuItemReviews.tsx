'use client'

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import ReviewForm from './ReviewForm';
import Rating from './ui/rating';
import { getAllReviews, getMenuItemReviewStats } from '@/lib/actions/review-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

interface Review {
    id: string;
    title: string | null;
    content: string;
    rating: number;
    createdAt: Date;
    user: {
        name: string | null;
    };
}

interface ReviewStats {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Array<{
        rating: number;
        _count: {
            rating: number;
        };
    }>;
}

interface MenuItemReviewsProps {
    menuItemId: string;
    menuItemName: string;
}

const MenuItemReviews = ({ menuItemId, menuItemName }: MenuItemReviewsProps) => {
    const { data: session } = useSession();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [stats, setStats] = useState<ReviewStats | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const [reviewsData, statsData] = await Promise.all([
                getAllReviews({ menuItemId }),
                getMenuItemReviewStats({ menuItemId })
            ]);
            setReviews(reviewsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    }, [menuItemId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleReviewSubmitted = () => {
        fetchReviews(); // Refresh reviews after submission
    };

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Review Stats */}
            {stats && stats.totalReviews > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <span>Customer Reviews</span>
                            <Badge variant="secondary">{stats.totalReviews} reviews</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-4">
                            <div className="text-3xl font-bold">
                                {stats.averageRating.toFixed(1)}
                            </div>
                            <div className="flex flex-col gap-1">
                                <Rating value={stats.averageRating} />
                                <span className="text-sm text-gray-600">
                                    Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? 's' : ''}
                                </span>
                            </div>
                        </div>

                        {/* Rating Distribution */}
                        <div className="mt-4 space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = stats.ratingDistribution.find(r => r.rating === rating)?._count.rating || 0;
                                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;

                                return (
                                    <div key={rating} className="flex items-center gap-2 text-sm">
                                        <span className="w-8">{rating}★</span>
                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="w-8 text-gray-600">{count}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Review Form */}
            {session?.user && (
                <div className="flex justify-center">
                    <ReviewForm
                        userId={session.user.id}
                        menuItemId={menuItemId}
                        menuItemName={menuItemName}
                        onReviewSubmitted={handleReviewSubmitted}
                    />
                </div>
            )}

            {/* Reviews List */}
            <div className="space-y-4">
                {reviews.length > 0 ? (
                    <>
                        <h3 className="text-lg font-semibold">
                            Reviews ({reviews.length})
                        </h3>
                        {reviews.map((review) => (
                            <Card key={review.id}>
                                <CardContent className="pt-6">
                                    <div className="space-y-3">
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Rating value={review.rating} />
                                                    <span className="text-sm text-gray-600">
                                                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                                    </span>
                                                </div>
                                                {review.title && (
                                                    <h4 className="font-semibold">{review.title}</h4>
                                                )}
                                            </div>
                                            <Badge variant="outline">
                                                {review.user.name || 'Anonymous'}
                                            </Badge>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">
                                            {review.content}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </>
                ) : (
                    <Card>
                        <CardContent className="pt-6 text-center">
                            <p className="text-gray-600">
                                No reviews yet. {session?.user ? 'Be the first to review this item!' : 'Sign in to leave a review.'}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default MenuItemReviews; 