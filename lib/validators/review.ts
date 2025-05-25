import { z } from "zod";

export const insertReviewSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(3, 'Description must be at least 3 characters'),
    menuItemId: z.string().min(1, 'Menu item is required'),
    userId: z.string().min(1, 'User is required'),
    rating: z.coerce
        .number()
        .int()
        .min(1, 'Rating must be at least 1')
        .max(5, 'Rating must be at most 5'),
});

export const reviewFormDefaultValues = {
    title: '',
    description: '',
    menuItemId: '',
    userId: '',
    rating: 5,
}; 