import Image from "next/image";

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
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col max-w-xs">
            {review.menuItem.image && (
                <Image
                    src={review.menuItem.image}
                    alt={review.menuItem.name}
                    width={400}
                    height={180}
                    className="w-full h-40 object-cover rounded-t-lg"
                />
            )}
            <div className="p-6 flex flex-col flex-1 text-left">
                <p className="text-sm text-gray-500 mb-1">Menu Item: {review.menuItem.name}</p>
                <h3 className="text-lg font-semibold">{review.title ?? "Untitled"}</h3>
                <p className="text-gray-700 mb-2">{review.content}</p>
                <p className="text-yellow-500 mt-auto">{"★".repeat(review.rating)}</p>
                <p className="text-xs text-gray-400 mt-2">- {review.user.name ?? "Anonymous"}</p>
            </div>
        </div>
    );
} 