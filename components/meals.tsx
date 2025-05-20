import Image from "next/image"
import { Check } from "lucide-react"
import { prisma } from "@/lib/prisma"
import Link from "next/link"


async function getTopRatedItems() {
    // Get menu items with their reviews
    const menuItems = await prisma.menuItem.findMany({
        where: {
            isAvailable: true,
        },
        include: {
            reviews: true,
            category: true,
        },
        take: 10, // Get more items initially to calculate ratings
    });

    // Calculate average rating for each item
    const itemsWithRating = menuItems.map(item => {
        const reviews = item.reviews;
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0;
        const reviewCount = reviews.length;

        return {
            ...item,
            avgRating,
            reviewCount
        };
    });

    // Sort by average rating (descending)
    itemsWithRating.sort((a, b) => b.avgRating - a.avgRating);

    // Return top 2 items
    return itemsWithRating.slice(0, 2);
}

export async function Meals() {
    const topRatedItems = await getTopRatedItems();

    const diets = [
        "Vegetarian",
        "Vegan",
        "Pescatarian",
        "Gluten-free",
        "Lactose-free",
        "Keto",
        "Paleo",
        "Low FODMAP",
        "Kid-friendly",
    ];

    return (
        <section id="meals" className="w-full py-24 bg-gray-100">
            <div className="container mx-auto max-w-7xl px-4 md:px-6">
                {/* Header */}
                <div className="text-center space-y-2 mb-12">
                    <div className="inline-block bg-orange-100 text-orange-600 text-sm px-3 py-1 rounded-full font-medium">
                        MENU
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                        Our highest rated dishes
                    </h2>
                </div>

                {/* Content Grid */}
                <div className="grid gap-10 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 items-start">
                    {/* Dynamic Meal Cards */}
                    {topRatedItems.map((item) => (
                        <div key={item.id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            <div className="relative h-48 bg-gray-200">
                                {item.image ? (
                                    <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                        No image
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold">{item.name}</h3>
                                    <span className="font-medium text-orange-600">
                                        ${Number(item.price).toFixed(2)}
                                    </span>
                                </div>

                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                    {item.description || "No description available."}
                                </p>

                                {/* Display rating */}
                                <div className="mt-2 flex items-center">
                                    <span className="text-yellow-500 mr-1">★</span>
                                    <span className="text-sm font-medium">
                                        {item.avgRating.toFixed(1)}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-1">
                                        ({item.reviewCount} {item.reviewCount === 1 ? 'review' : 'reviews'})
                                    </span>
                                </div>

                                <div className="mt-3 flex flex-wrap">
                                    {item.isVegetarian && (
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                            Vegetarian
                                        </span>
                                    )}
                                    {item.isVegan && (
                                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                            Vegan
                                        </span>
                                    )}
                                    {item.isGlutenFree && (
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                            Gluten Free
                                        </span>
                                    )}
                                    {item.isDairyFree && (
                                        <span className="bg-blue-400 text-white text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                            Dairy Free
                                        </span>
                                    )}
                                    {item.isSpicy && (
                                        <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                            Spicy
                                        </span>
                                    )}
                                </div>

                                <div className="mt-4 flex justify-between">
                                    <Link
                                        href={`/menu/${item.id}`}
                                        className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                                    >
                                        View details
                                    </Link>
                                    <button className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm">
                                        Add to order
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Diet List */}
                    <div className="space-y-6 p-6 bg-white rounded-xl shadow-md">
                        <h3 className="text-2xl font-bold text-gray-900">Works with any diet:</h3>
                        <ul className="space-y-3 text-gray-700">
                            {diets.map((diet) => (
                                <li key={diet} className="flex items-center gap-2">
                                    <Check className="h-5 w-5 text-orange-500" />
                                    <span>{diet}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer Link */}
                <div className="mt-12 text-center">
                    <Link href="/menu" className="text-orange-600 hover:underline text-base font-medium">
                        See Full Menu →
                    </Link>
                </div>
            </div>
        </section>
    )
}
