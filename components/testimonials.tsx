import Image from "next/image"
import { MotionDiv } from "@/utils/motion"

const testimonials = [
    {
        name: "Dave Bryson",
        quote:
            "Inexpensive, healthy and great-tasting meals, without even having to order manually! It feels truly magical.",
    },
    {
        name: "Ben Hadley",
        quote:
            "The AI algorithm is crazy good, it chooses the right meals for me every time. It&apos;s amazing not to worry about food anymore!",
    },
    {
        name: "Steve Miller",
        quote:
            "Omnifood is a life saver! I just started a company, so there&apos;s no time for cooking. I couldn&apos;t live without my daily meals now!",
    },
    {
        name: "Hannah Smith",
        quote:
            "I got Omnifood for the whole family, and it frees up so much time! Plus, everything is organic and vegan and without plastic.",
    },
]

const galleryImages = [
    "/images/fernando-andrade-kQm_pIEE26M-unsplash.jpg",
    "/images/geraldine-lewa-axgXb6_Tz3I-unsplash.jpg",
    "/images/james-jeremy-beckers-JBQ3v5Er26o-unsplash.jpg",
    "/images/kristof-korody-VOC-tjwRwc4-unsplash.jpg",
    "/images/manek-singh-DpMzZFt18r0-unsplash.jpg",
    "/images/martin-baron-gxNks4L7NuQ-unsplash.jpg",
    "/images/martin-baron-klpS_KGFRDM-unsplash.jpg",
    "/images/vinn-koonyosying-vBOxsZrfiCw-unsplash.jpg",
    "/images/martin-baron-7Il-XZ2j4SU-unsplash.jpg",
]

export function Testimonials() {
    return (
        <section id="testimonials" className="w-full py-20 bg-orange-50">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="text-center space-y-3 mb-14">
                    <span className="text-sm font-medium text-orange-500 bg-orange-100 px-3 py-1 rounded-full">
                        TESTIMONIALS
                    </span>
                    <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
                        Once you try it, you can&apos;t go back
                    </h2>
                </div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Testimonials List */}
                    <div className="space-y-10">
                        {testimonials.map((t, i) => (
                            <MotionDiv
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="flex gap-4"
                            >
                                <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                                    <Image
                                        src={`/images/james-jeremy-beckers-JBQ3v5Er26o-unsplash.jpg`}
                                        alt={`Photo of ${t.name}`}
                                        width={48}
                                        height={48}
                                        className="object-cover h-full w-full"
                                    />
                                </div>
                                <div>
                                    <p className="text-gray-700 italic">&quot;{t.quote}&quot;</p>
                                    <p className="mt-2 text-sm text-gray-500 font-semibold">— {t.name}</p>
                                </div>
                            </MotionDiv>
                        ))}
                    </div>

                    {/* Image Gallery */}
                    <MotionDiv
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                        className="flex overflow-x-auto gap-4 scrollbar-thin scrollbar-thumb-orange-300 scrollbar-track-orange-100 py-20 px-1"
                    >
                        {galleryImages.map((src, i) => (
                            <div key={i} className="flex-shrink-0 w-48 h-48 rounded-lg overflow-hidden">
                                <Image
                                    src={src}
                                    alt={`Gallery image ${i + 1}`}
                                    width={192}
                                    height={192}
                                    className="object-cover w-full h-full rounded-lg hover:scale-105 transition-transform"
                                />
                            </div>
                        ))}
                    </MotionDiv>

                </div>
            </div>
        </section>
    )
}
