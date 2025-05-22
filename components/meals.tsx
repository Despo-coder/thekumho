// import Image from "next/image"
// import { Check } from "lucide-react"
import { prisma } from "@/lib/prisma"
import Image from "next/image";
import Link from "next/link"


async function getTopRatedItems() {
    // console.log("Fetching top rated items...");

    // Get menu items with their reviews
    const menuItems = await prisma.menuItem.findMany({
        where: {
            isAvailable: true,
        },
        include: {
            reviews: true,
            category: true,
        },
        take: 20, // Get more items initially to calculate ratings
    });

    //console.log(`Found ${menuItems.length} available menu items`);

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

    // Log items with their ratings for debugging
    itemsWithRating.forEach(item => {
        console.log(`Item: ${item.name}, Rating: ${item.avgRating.toFixed(1)}, Reviews: ${item.reviewCount}, ID: ${item.id}`);
    });

    // Sort by average rating (descending), then by review count (descending) as tiebreaker
    itemsWithRating.sort((a, b) => {
        // Primary sort by rating
        if (b.avgRating !== a.avgRating) {
            return b.avgRating - a.avgRating;
        }
        // Secondary sort by review count (more reviews is better)
        if (b.reviewCount !== a.reviewCount) {
            return b.reviewCount - a.reviewCount;
        }
        // Tertiary sort by date (newer is better)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Log the sorted order
    // console.log("Top items after sorting:");
    // itemsWithRating.slice(0, 5).forEach((item, index) => {
    //     console.log(`${index + 1}. ${item.name} - Rating: ${item.avgRating.toFixed(1)}, Reviews: ${item.reviewCount}`);
    // });

    // Return top 3 items
    return itemsWithRating.slice(0, 3);
}

export async function Meals() {
    const topRatedItems = await getTopRatedItems();

    // const diets = [
    //     "Vegetarian",
    //     "Vegan",
    //     "Pescatarian",
    //     "Gluten-free",
    //     "Lactose-free",
    //     "Keto",
    //     "Paleo",
    //     "Low FODMAP",
    //     "Kid-friendly",
    // ];

    return (
        <>
            <section className="py-16 md:py-24 bg-white" id="menu">
                <div className="container mx-auto px-6 md:px-10 text-center">
                    <h3 className="text-3xl md:text-4xl font-bold text-[#1C1C1C] mb-4">Discover Our Culinary Delights</h3>
                    <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-12">
                        From classic Nigiri to innovative Maki rolls, our menu is a celebration of Japanese gastronomy. Each dish is prepared with passion and precision.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {topRatedItems.map((item) => (
                            <div key={item.id} className="bg-[#F9F5F2] rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                                {item.image ? (
                                    <Image
                                        alt={item.name}
                                        className="w-full h-56 object-cover"
                                        src={item.image}
                                        width={500}
                                        height={500}
                                    />
                                ) : (
                                    <div className="w-full h-56 bg-gray-200 flex items-center justify-center text-gray-400">
                                        No image available
                                    </div>
                                )}
                                <div className="p-6">
                                    <h4 className="text-xl font-semibold text-[#1C1C1C] mb-2">{item.name}</h4>
                                    <p className="text-gray-600 text-sm mb-4">{item.description || "No description available."}</p>

                                    {/* Rating display */}
                                    <div className="flex items-center mb-4">
                                        <span className="text-yellow-500 mr-1">★</span>
                                        <span className="text-sm font-medium">
                                            {item.avgRating.toFixed(1)}
                                        </span>
                                        <span className="text-xs text-gray-500 ml-1">
                                            ({item.reviewCount} {item.reviewCount === 1 ? 'review' : 'reviews'})
                                        </span>
                                    </div>

                                    {/* Dietary tags */}
                                    <div className="flex flex-wrap gap-1 mb-4">
                                        {item.isVegetarian && (
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                Vegetarian
                                            </span>
                                        )}
                                        {item.isVegan && (
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                Vegan
                                            </span>
                                        )}
                                        {item.isGlutenFree && (
                                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                                Gluten Free
                                            </span>
                                        )}
                                        {item.isDairyFree && (
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                Dairy Free
                                            </span>
                                        )}
                                        {item.isSpicy && (
                                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                                Spicy
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex justify-center items-center">
                                        <span className="text-orange-500 font-bold text-lg">${Number(item.price).toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link className="md:mt-24 mt-12 inline-flex items-center justify-center rounded-full border-2 border-[#e92933] px-8 py-3 text-base font-semibold text-[#e92933] shadow-sm transition-colors duration-300 ease-in-out hover:bg-[#e92933] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#e92933] focus:ring-offset-2 focus:ring-offset-white" href="/menu">
                        View Full Menu
                    </Link>
                </div>
            </section>
        </>
    )
}
