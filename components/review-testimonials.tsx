"use client";

import { useState, useRef, useEffect } from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import TestimonialCard from "./TestimonialCard";

interface Review {
    id: string;
    title: string | null;
    content: string;
    rating: number;
    createdAt: Date;
    menuItem: {
        name: string;
        image: string | null;
    };
    user: {
        name: string | null;
    };
}

export default function Testimonials({ initialReviews }: { initialReviews: Review[] }) {
    const [currentSlide, setCurrentSlide] = useState(0);
    const timer = useRef<NodeJS.Timeout | null>(null);
    const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
        loop: true,
        slides: {
            perView: 1,
            spacing: 16,
            origin: "center"
        },
        breakpoints: {
            "(min-width: 768px)": {
                slides: {
                    perView: 2,
                    spacing: 24,
                    origin: "center"
                }
            },
            "(min-width: 1024px)": {
                slides: {
                    perView: 3,
                    spacing: 32,
                    origin: "center"
                }
            },
        },
        slideChanged(s) {
            setCurrentSlide(s.track.details.rel);
        },
    });

    // Autoplay effect
    useEffect(() => {
        if (!instanceRef.current) return;
        if (timer.current) clearInterval(timer.current);
        timer.current = setInterval(() => {
            if (instanceRef.current) {
                instanceRef.current.next();
            }
        }, 3000);
        return () => {
            if (timer.current) clearInterval(timer.current);
        };
    }, [instanceRef]);

    return (
        // <section className="py-16 bg-gradient-to-b from-white to-orange-50">
        <section className="py-16 bg-zinc-100">
            <div className="container mx-auto px-4 max-w-6xl">
                <div className="text-center space-y-3 mb-10">
                    {/* <span className="text-sm font-medium text-orange-500 bg-orange-100 px-3 py-1 rounded-full">
                        CUSTOMER REVIEWS
                    </span> */}
                    <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                        What Our Customers Say
                    </h2>
                </div>
                <div ref={sliderRef} className="keen-slider min-h-[420px]">
                    {initialReviews.map((review) => (
                        <div key={review.id} className="keen-slider__slide flex justify-center items-stretch">
                            <div className="w-full max-w-sm">
                                <TestimonialCard review={review} />
                            </div>
                        </div>
                    ))}
                </div>
                {/* Dots navigation */}
                <div className="flex justify-center gap-2 mt-6">
                    {initialReviews.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => instanceRef.current?.moveToIdx(idx)}
                            className={`h-3 w-3 rounded-full transition-colors duration-200 border border-orange-400 focus:outline-none ${currentSlide === idx ? "bg-orange-500" : "bg-orange-200"
                                }`}
                            aria-label={`Go to slide ${idx + 1}`}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
