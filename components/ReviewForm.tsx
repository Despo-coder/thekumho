'use client'

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { reviewFormDefaultValues, insertReviewSchema } from '@/lib/validators/review';
import { zodResolver } from '@hookform/resolvers/zod';
import { StarIcon } from 'lucide-react';
import { useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from "sonner";
import { z } from 'zod';
import { createUpdateReview, getAllReviewsForUser, getVerifiedPurchase } from '@/lib/actions/review-actions';

interface ReviewFormProps {
    userId: string;
    menuItemId: string;
    menuItemName: string;
    onReviewSubmitted: () => void;
}

const ReviewForm = ({ userId, menuItemId, menuItemName, onReviewSubmitted }: ReviewFormProps) => {
    const [open, setOpen] = useState(false)
    const [isCheckingPurchase, setIsCheckingPurchase] = useState(false)

    const form = useForm<z.infer<typeof insertReviewSchema>>({
        resolver: zodResolver(insertReviewSchema),
        defaultValues: reviewFormDefaultValues
    })
    //console.log(canReview)
    const handleOpenForm = async () => {
        setIsCheckingPurchase(true)

        // Check if user has purchased this item
        const hasPurchased = await getVerifiedPurchase({ menuItemId })

        if (!hasPurchased) {
            setIsCheckingPurchase(false)
            toast.error('You can only review items you have purchased')
            return
        }

        form.setValue('menuItemId', menuItemId)
        form.setValue('userId', userId)

        // Check if user has already reviewed this item
        try {
            const existingReview = await getAllReviewsForUser({ menuItemId })
            if (existingReview) {
                form.setValue('title', existingReview.title ?? '');
                form.setValue('description', existingReview.content);
                form.setValue('rating', existingReview.rating);
            }
        } catch (error) {
            console.error('Error fetching existing review:', error)
        }

        setIsCheckingPurchase(false)
        setOpen(true)
    }

    const onSubmit: SubmitHandler<z.infer<typeof insertReviewSchema>> = async (data) => {
        const res = await createUpdateReview({ ...data, menuItemId })

        if (!res.success) {
            toast.error(res.message)
        } else {
            setOpen(false)
            onReviewSubmitted?.()
            toast.success(res.message)
            form.reset(reviewFormDefaultValues)
        }
    }

    return (
        <>
            <Button
                onClick={handleOpenForm}
                variant='default'
                disabled={isCheckingPurchase}
                className="w-full sm:w-auto"
            >
                {isCheckingPurchase ? 'Checking...' : 'Write a review'}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className='sm:max-w-[425px]'>
                    <Form {...form}>
                        <form method="POST" onSubmit={form.handleSubmit(onSubmit)}>
                            <DialogHeader>
                                <DialogTitle>Review: {menuItemName}</DialogTitle>
                                <DialogDescription>
                                    Share your experience with this menu item
                                </DialogDescription>
                            </DialogHeader>
                            <div className='grid gap-4 py-4'>
                                <FormField
                                    control={form.control}
                                    name='title'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Title</FormLabel>
                                            <FormControl>
                                                <Input placeholder='Enter review title' {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='description'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Review</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder='Tell us about your experience with this item...'
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name='rating'
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Rating</FormLabel>
                                            <Select
                                                onValueChange={val => field.onChange(Number(val))}
                                                value={field.value ? field.value.toString() : ''}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder='Select Rating' />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {Array.from({ length: 5 }, (_, i) => (
                                                        <SelectItem key={i} value={`${i + 1}`}>
                                                            <div className="flex items-center gap-2">
                                                                <span>{i + 1}</span>
                                                                <StarIcon className='w-4 h-4 fill-yellow-400 text-yellow-400' />
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type='submit'
                                    size='sm'
                                    disabled={form.formState.isSubmitting}
                                    className='w-full'
                                >
                                    {form.formState.isSubmitting ? 'Submitting...' : 'Submit Review'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default ReviewForm 