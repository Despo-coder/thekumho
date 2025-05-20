import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";

async function getMenuItems() {
    const categories = await prisma.category.findMany({
        include: {
            items: {
                include: {
                    menu: true,
                },
                where: {
                    isAvailable: true,
                },
            },
        },
    });

    return categories;
}

export default async function MenuPage() {
    const categories = await getMenuItems();

    return (
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-center mb-12">Our Menu</h1>

            <div className="flex flex-wrap mb-6">
                <div className="w-full mb-6">
                    <div className="flex flex-wrap items-center">
                        <span className="mr-4 font-medium">Filter by:</span>
                        <button className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">
                            All
                        </button>
                        <button className="bg-gray-100 hover:bg-orange-100 hover:text-orange-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">
                            Vegetarian
                        </button>
                        <button className="bg-gray-100 hover:bg-orange-100 hover:text-orange-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">
                            Vegan
                        </button>
                        <button className="bg-gray-100 hover:bg-orange-100 hover:text-orange-800 px-3 py-1 rounded-full text-sm mr-2 mb-2">
                            Gluten Free
                        </button>
                    </div>
                </div>
            </div>

            {categories.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No menu items available yet. Check back soon!</p>
                </div>
            ) : (
                categories.map((category) => (
                    <div key={category.id} className="mb-16">
                        <h2 className="text-2xl font-bold mb-6 pb-2 border-b">{category.name}</h2>

                        {category.items.length === 0 ? (
                            <p className="text-gray-500">No items in this category yet.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {category.items.map((item) => (
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
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>
    );
} 