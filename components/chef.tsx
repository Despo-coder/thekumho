import Image from "next/image"
import { Quote } from "lucide-react"
// import { Badge } from "@/components/ui/badge"
import Link from "next/link"


export function ChefSpotlight() {
    return (
        <section className="w-full bg-white py-4 md:py-12">
            <div className="container max-w-6xl px-6 mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {/* Image */}
                <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden shadow-xl">
                    <Image
                        src="/images/rc-cf-FMh5o5m5N9E-unsplash.jpg"
                        alt="Chef portrait"
                        layout="fill"
                        objectFit="cover"
                        className="rounded-xl"
                    />
                </div>

                {/* Text Content */}
                <div className="space-y-6">
                    {/* <Badge className="bg-orange-100 text-orange-700 text-sm px-3 py-1 rounded-full">
                        MEET THE CHEF
                    </Badge> */}

                    <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                        Crafted With Passion by Chef Takumi Sato
                    </h2>

                    <p className="text-lg text-gray-700">
                        With over 20 years of culinary experience, Chef Sato brings the precision of traditional Japanese techniques and a deep respect for seasonal ingredients. His philosophy: “Every dish tells a story worth tasting.”
                    </p>

                    <div className="flex items-center gap-4 mt-6">
                        <Quote className="h-8 w-8 text-orange-500" />
                        <p className="italic text-gray-600">
                            “Food isn’t just nourishment — it’s connection, craft, and care.”
                        </p>
                    </div>

                    <div className="mt-8">
                        <Link
                            href="/reservation"
                            className="inline-block rounded-lg bg-orange-600 px-6 py-3 text-white font-medium shadow hover:bg-orange-700 transition"
                        >
                            Book Your Table
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
