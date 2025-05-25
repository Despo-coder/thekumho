import Image from "next/image";
import Rating from "./ui/rating";
import { UtensilsCrossed } from "lucide-react";

interface TestimonialCardProps {
    review: {
        id: string;
        title: string | null;
        content: string;
        rating: number;
        createdAt: Date;
        menuItem: { name: string; image: string | null };
        user: { name: string | null };
    };
}

export default function TestimonialCard({ review }: TestimonialCardProps) {
    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col w-full h-full min-h-[400px]">
            {/* Image section - always present with consistent height */}
            <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                {review.menuItem.image ? (
                    <Image
                        src={review.menuItem.image}
                        alt={review.menuItem.name}
                        width={400}
                        height={180}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                        <UtensilsCrossed className="w-12 h-12 mb-2" />
                        <span className="text-sm">No image</span>
                    </div>
                )}
            </div>

            {/* Content section */}
            <div className="p-6 flex flex-col flex-1 text-left">
                <p className="text-sm text-gray-500 mb-1">Menu Item: {review.menuItem.name}</p>
                <h3 className="text-lg font-semibold mb-2 line-clamp-2">{review.title ?? "Untitled"}</h3>
                <p className="text-gray-700 mb-4 flex-1 line-clamp-3">{review.content}</p>

                {/* Rating and user info - always at bottom */}
                <div className="mt-auto space-y-2">
                    <Rating value={review.rating} />
                    <p className="text-xs text-gray-400">- {review.user.name ?? "Anonymous"}</p>
                </div>
            </div>
        </div>
    );
} 