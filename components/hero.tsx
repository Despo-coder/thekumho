import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Hero() {
    return (
        <section className="relative py-12">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/images/international-student-navigator-australia-qByX8nRPpvg-unsplash.jpg"
                    alt="Background"
                    className="w-full h-full object-cover"
                    width={1000}
                    height={1000}
                />
                <div className="absolute inset-0 bg-black/80"></div> {/* Optional dark overlay */}
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto max-w-7xl px-4">
                <div className="grid gap-8 lg:grid-cols-2">
                    {/* Text Content */}
                    <div className="flex flex-col justify-center space-y-4 text-center lg:text-left text-white">
                        <h1 className="text-3xl font-sawarabiMincho sm:text-4xl lg:text-6xl">
                            Tradition meets innovation. A modern fusion of flavor, art, and soul.
                        </h1>
                        <p className="text-base sm:text-lg font-mulish font-small">
                            A modern interpretation of Japanese cuisine, Kumo offers a curated fusion menu that celebrates elegance, innovation, and a deep respect for flavor. Welcome to your new favorite ritual..
                        </p>
                        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center lg:justify-start">
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white">Start eating well</Button>
                            <Button variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white">Learn more</Button>
                        </div>
                        {/* <p className="text-sm font-medium text-orange-200">
                            250,000+ meals delivered last year!
                        </p> */}
                    </div>

                    {/* Image Stack (optional) */}
                    <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] mx-auto w-full max-w-[400px] sm:max-w-[500px]">
                        <div className="absolute top-8 right-4 md:top-10 md:right-0 w-[60%] h-[60%] z-10 rotate-[10deg]">
                            <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl">
                                <Image
                                    src="/images/kristof-korody-VOC-tjwRwc4-unsplash.jpg"
                                    alt="Gourmet shrimp dish"
                                    className="object-cover w-full h-full"
                                    width={500}
                                    height={500}
                                />
                            </div>
                        </div>

                        <div className="absolute top-28 right-22 md:right-44 lg:right-48 w-[70%] h-[70%] z-20 rotate-[-10deg] sm:block">
                            <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl">
                                <Image
                                    src="/images/vinn-koonyosying-vBOxsZrfiCw-unsplash.jpg"
                                    alt="Assortment of dishes"
                                    className="object-cover w-full h-full"
                                    width={500}
                                    height={500}
                                />
                            </div>
                        </div>

                        <div className="absolute  top-44 md:top-52 right-8 w-[70%] h-[70%] z-30 rotate-[5deg] lg:block">
                            <div className="relative w-full h-full rounded-lg overflow-hidden shadow-2xl">
                                <Image
                                    src="/images/manek-singh-DpMzZFt18r0-unsplash.jpg"
                                    alt="Healthy food bowls"
                                    className="object-cover w-full h-full"
                                    width={500}
                                    height={500}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
