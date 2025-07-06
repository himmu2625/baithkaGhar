"use client"

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star } from "lucide-react";
import { format } from "date-fns";

interface Review {
    _id: string;
    userId: {
        name: string;
    };
    rating: number;
    comment: string;
    createdAt: string;
}

interface RatingBreakdown {
    cleanliness: number;
    accuracy: number;
    communication: number;
    location: number;
    checkIn: number;
    value: number;
}

interface ReviewsSectionProps {
    propertyId: string;
    initialRating: number;
    initialReviewCount: number;
    initialRatingBreakdown: RatingBreakdown;
}

const RatingBar = ({ label, rating }: { label: string; rating: number }) => (
    <div className="flex items-center gap-4">
        <span className="w-32 text-sm text-gray-600">{label}</span>
        <Progress value={rating * 20} className="w-full h-2" />
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
);

export function ReviewsSection({ propertyId, initialRating, initialReviewCount, initialRatingBreakdown }: ReviewsSectionProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [visibleReviews, setVisibleReviews] = useState(4);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/reviews?propertyId=${propertyId}`);
                const data = await response.json();
                if (data.success) {
                    setReviews(data.reviews);
                }
            } catch (error) {
                console.error("Failed to fetch reviews:", error);
            } finally {
                setLoading(false);
            }
        };
        if (propertyId) {
            fetchReviews();
        }
    }, [propertyId]);

    const reviewCount = reviews.length > 0 ? reviews.length : initialReviewCount;

    return (
        <div id="reviews" className="py-8 border-t">
            <h2 className="text-2xl font-bold mb-4">
                <Star className="inline-block -mt-1 mr-2" />
                {initialRating.toFixed(1)} · {reviewCount} reviews
            </h2>

            {reviewCount > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 mb-8">
                        <RatingBar label="Cleanliness" rating={initialRatingBreakdown.cleanliness} />
                        <RatingBar label="Accuracy" rating={initialRatingBreakdown.accuracy} />
                        <RatingBar label="Communication" rating={initialRatingBreakdown.communication} />
                        <RatingBar label="Location" rating={initialRatingBreakdown.location} />
                        <RatingBar label="Check-in" rating={initialRatingBreakdown.checkIn} />
                        <RatingBar label="Value" rating={initialRatingBreakdown.value} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                        {reviews.slice(0, visibleReviews).map(review => (
                            <div key={review._id}>
                                <div className="flex items-center mb-2">
                                    <Avatar className="h-10 w-10 mr-4">
                                        <AvatarFallback>{review.userId.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold">{review.userId.name}</p>
                                        <p className="text-sm text-gray-500">{format(new Date(review.createdAt), "MMMM yyyy")}</p>
                                    </div>
                                </div>
                                <div className="flex items-center mb-1">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                                    ))}
                                </div>
                                <p className="text-gray-700 line-clamp-4">{review.comment}</p>
                            </div>
                        ))}
                    </div>

                    {reviews.length > visibleReviews && (
                        <Button variant="outline" className="mt-8" onClick={() => setVisibleReviews(prev => prev + 4)}>
                            Show more reviews
                        </Button>
                    )}
                </>
            ) : (
                <p>No reviews yet for this property.</p>
            )}
        </div>
    );
} 