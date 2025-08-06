import Image from "next/image"

export function HowItWorks() {
    return (
        <section id="how-it-works" className="w-full py-24 md:py-32 bg-[#FAF9F6]">
            <div className="container mx-auto max-w-7xl px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        {/* <div className="inline-block rounded-lg bg-orange-100 px-3 py-1 text-sm text-orange-600 font-medium">
                            HOW IT WORKS
                        </div> */}
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
                            From Reservation to First Bite — Simple, Elegant, Seamless
                        </h2>
                    </div>
                </div>

                {/* Step 1: Reserve */}
                <div className="mt-16 grid gap-10 lg:grid-cols-2 items-center">
                    <div className="space-y-4 order-1 lg:order-1">
                        <div className="text-5xl font-bold text-gray-200 ">01</div>
                        <h3 className="text-2xl font-bold text-gray-900">Reserve Your Table</h3>
                        <p className="text-gray-600 md:text-lg">
                            Choose your preferred date, time, and party size. Our seamless reservation system ensures you get the perfect table, whether it&apos;s an intimate dinner or a celebration.
                        </p>
                    </div>
                    <div className="flex justify-center order-2  lg:order-2">
                        <div className="relative h-[400px] w-[250px]">



                            <Image
                                src="/images/martin-baron-gxNks4L7NuQ-unsplash.jpg"
                                alt="Making a reservation on phone"
                                width={250}
                                height={400}
                                className="object-cover rounded-xl shadow-md"
                            />
                        </div>
                    </div>
                </div>

                {/* Step 2: Experience */}
                <div className="mt-8 flex flex-col-reverse lg:grid lg:grid-cols-2 lg:items-center">
                    <div className="space-y-4 order-1 md:order-2 lg:order-2">
                        <div className="text-5xl font-bold text-gray-200">02</div>
                        <h3 className="text-2xl font-bold text-gray-900">Arrive & Immerse Yourself</h3>
                        <p className="text-gray-600 md:text-lg">
                            Step into a refined atmosphere curated for comfort and discovery. Let our staff guide your experience while our chefs begin crafting your meal with the freshest seasonal ingredients.
                        </p>
                    </div>
                    <div className="mt-4 flex justify-center odrer-2 md:order-1 lg:order-1">
                        <div className="relative h-[400px] w-[250px]">
                            <Image
                                src="/images/geraldine-lewa-axgXb6_Tz3I-unsplash.jpg"
                                alt="Chef preparing gourmet dish"
                                width={250}
                                height={400}
                                className="object-cover rounded-xl shadow-md"
                            />
                        </div>
                    </div>
                </div>
                {/* Step 3: Enjoy */}
                <div className="mt-16 grid gap-10 lg:grid-cols-2 items-center">
                    <div className="space-y-4  order-1 md:order-2 lg:order-1">
                        <div className="text-5xl font-bold text-gray-200">03</div>
                        <h3 className="text-2xl font-bold text-gray-900">Savor Every Detail</h3>
                        <p className="text-gray-600  md:text-lg">
                            From your first bite to the last sip, every dish is served with intention. Taste the balance of flavors, enjoy the artistry, and let the evening leave a lasting impression.
                        </p>
                    </div>
                    <div className="flex justify-center order-2 md:order-1 lg:order-2">
                        <div className="relative h-[400px] w-[250px]">
                            <Image
                                src="/images/kristof-korody-VOC-tjwRwc4-unsplash.jpg"
                                alt="Fine dining dish being served"
                                width={250}
                                height={400}
                                className="object-cover rounded-xl shadow-md"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
