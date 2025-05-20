import Image from "next/image"
import { Check, Flame } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

export function Meals() {
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
                        KUMO has a wide range of dishes to offer
                    </h2>
                </div>

                {/* Content Grid */}
                <div className="grid gap-10 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 items-start">
                    {/* Meal Card 1 */}
                    <Card className="overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300 rounded-xl">
                        <Image
                            src="/images/martin-baron-7Il-XZ2j4SU-unsplash.jpg"
                            alt="Japanese Gyozas"
                            width={600}
                            height={400}
                            className="w-full h-66 object-cover rounded-t-xl -mt-6"
                        />
                        <CardContent className="p-6 space-y-4">
                            <Badge className="bg-green-100 text-green-800">VEGETARIAN</Badge>
                            <h3 className="text-2xl font-semibold">Japanese Gyozas</h3>
                            <div className="text-sm text-gray-700 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Flame className="h-5 w-5 text-orange-500" />
                                    <span>650 calories</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">NutriScore ®</span>
                                    <span>74</span>
                                </div>
                                <div>4.9 rating (537)</div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Meal Card 2 */}
                    <Card className="overflow-hidden shadow-md hover:shadow-2xl transition-shadow duration-300">
                        <Image
                            src="/images/martin-baron-7Il-XZ2j4SU-unsplash.jpg"
                            alt="Avocado Salad"
                            width={600}
                            height={400}
                            className="w-full h-66 object-cover rounded-t-xl -mt-6"
                        />
                        <CardContent className="p-6 space-y-4">
                            <div className="flex gap-2">
                                <Badge className="bg-green-100 text-green-800">VEGAN</Badge>
                                <Badge className="bg-yellow-100 text-yellow-800">PALEO</Badge>
                            </div>
                            <h3 className="text-2xl font-semibold">Avocado Salad</h3>
                            <div className="text-sm text-gray-700 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Flame className="h-5 w-5 text-orange-500" />
                                    <span>400 calories</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">NutriScore ®</span>
                                    <span>92</span>
                                </div>
                                <div>4.8 rating (441)</div>
                            </div>
                        </CardContent>
                    </Card>

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
                    <a href="#" className="text-orange-600 hover:underline text-base font-medium">
                        See Menu →
                    </a>
                </div>
            </div>
        </section>
    )
}
