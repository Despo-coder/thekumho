"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Review } from "@prisma/client";

// Types for our data
type MenuItem = {
    id: string;
    name: string;
    description: string | null;
    price: number | bigint;
    image: string | null;
    isAvailable: boolean;
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
    isNutFree: boolean;
    isPescatarian: boolean;
    isSpicy: boolean;
    reviews: Review[];
    menu: {
        id: string;
        name: string;
    };
};

type Category = {
    id: string;
    name: string;
    items: MenuItem[];
};

export default function MenuPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState("");
    const [dietaryFilters, setDietaryFilters] = useState({
        vegetarian: false,
        vegan: false,
        glutenFree: false,
        dairyFree: false,
        nutFree: false,
        pescatarian: false,
    });
    const [sortOrder, setSortOrder] = useState<"price-asc" | "price-desc" | "rating">("price-asc");
    const [showFilters, setShowFilters] = useState(false);

    // Function to calculate average rating
    const getAverageRating = (reviews: Review[]) => {
        if (reviews.length === 0) return 0;
        const sum = reviews.reduce((total: number, review: Review) => total + review.rating, 0);
        return parseFloat((sum / reviews.length).toFixed(1));
    };

    // Fetch menu items
    useEffect(() => {
        const fetchMenuItems = async () => {
            try {
                const response = await fetch("/api/menu");
                const data = await response.json();

                if (data.categories) {
                    setCategories(data.categories);
                    setFilteredCategories(data.categories);
                }
            } catch (error) {
                console.error("Error fetching menu items:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMenuItems();
    }, []);

    // Filter and sort menu items
    useEffect(() => {
        const applyFilters = () => {
            const filtered = categories.map(category => {
                // Filter items based on search and dietary filters
                const filteredItems = category.items.filter(item => {
                    // Search filter
                    const matchesSearch = searchTerm === "" ||
                        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));

                    // Dietary filters
                    const matchesDietary = (
                        (!dietaryFilters.vegetarian || item.isVegetarian) &&
                        (!dietaryFilters.vegan || item.isVegan) &&
                        (!dietaryFilters.glutenFree || item.isGlutenFree) &&
                        (!dietaryFilters.dairyFree || item.isDairyFree) &&
                        (!dietaryFilters.nutFree || item.isNutFree) &&
                        (!dietaryFilters.pescatarian || item.isPescatarian)
                    );

                    return matchesSearch && matchesDietary;
                });

                // Sort items
                const sortedItems = [...filteredItems].sort((a, b) => {
                    if (sortOrder === "price-asc") {
                        return Number(a.price) - Number(b.price);
                    } else if (sortOrder === "price-desc") {
                        return Number(b.price) - Number(a.price);
                    } else {
                        // Sort by rating
                        return getAverageRating(b.reviews) - getAverageRating(a.reviews);
                    }
                });

                return {
                    ...category,
                    items: sortedItems
                };
            }).filter(category => category.items.length > 0); // Remove empty categories

            setFilteredCategories(filtered);
        };

        applyFilters();
    }, [categories, searchTerm, dietaryFilters, sortOrder]);

    // Toggle dietary filter
    const toggleDietaryFilter = (filter: keyof typeof dietaryFilters) => {
        setDietaryFilters(prev => ({
            ...prev,
            [filter]: !prev[filter]
        }));
    };

    // Reset all filters
    const resetFilters = () => {
        setSearchTerm("");
        setDietaryFilters({
            vegetarian: false,
            vegan: false,
            glutenFree: false,
            dairyFree: false,
            nutFree: false,
            pescatarian: false,
        });
        setSortOrder("price-asc");
    };

    return (
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 bg-[#FAF9F6]">
            <h1 className="text-3xl font-bold text-center mb-8">Our Menu</h1>

            {/* Search and Filter Bar */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row gap-3 mb-4">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search menu items..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex space-x-2 items-center">
                        <select
                            className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as "price-asc" | "price-desc" | "rating")}
                        >
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                            <option value="rating">Top Rated</option>
                        </select>

                        <button
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal className="h-5 w-5 mr-2" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Expandable Filters */}
                {showFilters && (
                    <div className="bg-gray-50 p-4 rounded-md mt-2 border border-gray-200">
                        <div className="flex flex-wrap items-center">
                            <span className="mr-4 font-medium mb-2">Dietary Preferences:</span>
                            <div className="flex flex-wrap">
                                <button
                                    className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 ${dietaryFilters.vegetarian ? 'bg-green-100 text-green-800' : 'bg-gray-100 hover:bg-green-50'}`}
                                    onClick={() => toggleDietaryFilter('vegetarian')}
                                >
                                    Vegetarian
                                </button>
                                <button
                                    className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 ${dietaryFilters.vegan ? 'bg-green-100 text-green-800' : 'bg-gray-100 hover:bg-green-50'}`}
                                    onClick={() => toggleDietaryFilter('vegan')}
                                >
                                    Vegan
                                </button>
                                <button
                                    className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 ${dietaryFilters.glutenFree ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 hover:bg-yellow-50'}`}
                                    onClick={() => toggleDietaryFilter('glutenFree')}
                                >
                                    Gluten Free
                                </button>
                                <button
                                    className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 ${dietaryFilters.dairyFree ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-blue-50'}`}
                                    onClick={() => toggleDietaryFilter('dairyFree')}
                                >
                                    Dairy Free
                                </button>
                                <button
                                    className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 ${dietaryFilters.nutFree ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 hover:bg-amber-50'}`}
                                    onClick={() => toggleDietaryFilter('nutFree')}
                                >
                                    Nut Free
                                </button>
                                <button
                                    className={`px-3 py-1 rounded-full text-sm mr-2 mb-2 ${dietaryFilters.pescatarian ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 hover:bg-blue-50'}`}
                                    onClick={() => toggleDietaryFilter('pescatarian')}
                                >
                                    Pescatarian
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-end mt-2">
                            <button
                                className="text-sm text-gray-500 hover:text-gray-700"
                                onClick={resetFilters}
                            >
                                Reset All Filters
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="text-center py-12">
                    <div className="animate-pulse text-gray-500">Loading menu items...</div>
                </div>
            ) : filteredCategories.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-gray-500">No menu items match your filters. Try adjusting your search criteria.</p>
                    <button
                        className="mt-4 text-orange-600 hover:text-orange-700"
                        onClick={resetFilters}
                    >
                        Clear all filters
                    </button>
                </div>
            ) : (
                filteredCategories.map((category) => (
                    <div key={category.id} className="mb-16">
                        <h2 className="text-2xl font-bold mb-6 pb-2 border-b">{category.name}</h2>

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

                                        {/* Display rating */}
                                        <div className="mt-2 flex items-center">
                                            <span className="text-yellow-500 mr-1">★</span>
                                            <span className="text-sm font-medium">
                                                {getAverageRating(item.reviews)}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-1">
                                                ({item.reviews.length} {item.reviews.length === 1 ? 'review' : 'reviews'})
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
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                                    Dairy Free
                                                </span>
                                            )}
                                            {item.isNutFree && (
                                                <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                                    Nut Free
                                                </span>
                                            )}
                                            {item.isPescatarian && (
                                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                                    Pescatarian
                                                </span>
                                            )}
                                            {item.isSpicy && (
                                                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                                                    Spicy
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4 text-center">
                                            <Link
                                                href={`/menu/${item.id}`}
                                                className="block w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded transition-colors"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
} 