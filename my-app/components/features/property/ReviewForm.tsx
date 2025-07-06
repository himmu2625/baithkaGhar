"use client"

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const reviewSchema = z.object({
  rating: z.number().min(1, "Rating is required.").max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters.").max(1000),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  propertyId: string;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onReviewSubmit: () => void;
}

export function ReviewForm({ propertyId, userId, isOpen, onClose, onReviewSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
        rating: 0,
        comment: ''
    }
  });

  const handleRatingChange = (newRating: number) => {
    setRating(newRating);
    form.setValue('rating', newRating, { shouldValidate: true });
  }

  const onSubmit = async (data: ReviewFormValues) => {
    setIsSubmitting(true);
    try {
        const response = await fetch('/api/reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, propertyId, userId })
        });

        if (!response.ok) {
            throw new Error("Failed to submit review.");
        }
        toast({ title: "Success", description: "Your review has been submitted." });
        onReviewSubmit();
        onClose();
    } catch (error) {
        toast({ title: "Error", description: "Could not submit your review.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Write a review</DialogTitle>
          <DialogDescription>Share your experience with other travelers.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="font-semibold">Your rating</label>
            <div className="flex items-center gap-1 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-8 w-8 cursor-pointer transition-colors ${
                    (hoverRating || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                  }`}
                  onClick={() => handleRatingChange(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                />
              ))}
            </div>
            {form.formState.errors.rating && <p className="text-red-500 text-sm mt-1">{form.formState.errors.rating.message}</p>}
          </div>
          <div>
            <label htmlFor="comment" className="font-semibold">Your review</label>
            <Textarea id="comment" {...form.register('comment')} className="mt-2" />
            {form.formState.errors.comment && <p className="text-red-500 text-sm mt-1">{form.formState.errors.comment.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting...' : 'Submit Review'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 