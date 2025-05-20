"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FaqSection() {
    return (
        <section className="w-full  py-16">
            <div className="container px-4 md:px-6 ">
                <div className="mx-auto max-w-3xl space-y-8 ">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight text-[#1c1c1c]">FAQs</h2>
                        <p className="text-[#a3c2e3]">
                            Find answers to your questions about using Omnifood effectively and easily.
                        </p>
                    </div>

                    <Accordion type="single" collapsible className="space-y-4">
                        <AccordionItem value="item-1" className="border border-gray-800 rounded-lg overflow-hidden">
                            <AccordionTrigger className="px-6 py-4 text-[#1c1c1c] hover:no-underline hover:bg-gray-800/50 data-[state=open]:bg-gray-800/50">
                                <span className="text-left font-medium">How do I order?</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-1 pt-2 text-[#a3c2e3]">
                                Ordering is simple! Browse through our featured meals or use the search bar to find your favorites. Once
                                you&apos;ve selected a meal, just tap the &quot;Order&quot; button to get started.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2" className="border border-gray-800 rounded-lg overflow-hidden">
                            <AccordionTrigger className="px-6 py-4 text-[#1c1c1c] hover:no-underline hover:bg-gray-800/50 data-[state=open]:bg-gray-800/50">
                                <span className="text-left font-medium">Can I save favorites?</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-1 pt-2 text-[#a3c2e3]">
                                You can bookmark your favorite meals by tapping the &quot;Bookmark&quot; icon. This way, you can easily
                                access them whenever you&apos;re ready to order.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3" className="border border-gray-800 rounded-lg overflow-hidden">
                            <AccordionTrigger className="px-6 py-4 text[#1c1c1c] hover:no-underline hover:bg-gray-800/50 data-[state=open]:bg-gray-800/50">
                                <span className="text-left font-medium">What payment methods are accepted?</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-1 pt-2 text-[#a3c2e3]">
                                We accept various payment methods including credit cards, debit cards, and mobile wallets. You can
                                choose your preferred method at checkout for a seamless experience.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-4" className="border border-gray-800 rounded-lg overflow-hidden">
                            <AccordionTrigger className="px-6 py-4 text-[#1c1c1c] hover:no-underline hover:bg-gray-800/50 data-[state=open]:bg-gray-800/50">
                                <span className="text-left font-medium">How does delivery work?</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-1 pt-2 text-[#a3c2e3]">
                                Once your order is placed, our delivery partners will pick it up and bring it to your doorstep. You can
                                track your order in real-time within the app.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-5" className="border border-gray-800 rounded-lg overflow-hidden">
                            <AccordionTrigger className="px-6 py-4 text-[#1c1c1c] hover:no-underline hover:bg-gray-800/50 data-[state=open]:bg-gray-800/50">
                                <span className="text-left font-medium">Can I cancel orders?</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-1 pt-2 text-[#a3c2e3]">
                                Yes, you can cancel your order within a specific time frame. Just go to your order history and select
                                the order you wish to cancel.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-6" className="border border-gray-800 rounded-lg overflow-hidden">
                            <AccordionTrigger className="px-6 py-4 text-[#1c1c1c] hover:no-underline hover:bg-gray-800/50 data-[state=open]:bg-gray-800/50">
                                <span className="text-left font-medium">Are there any subscription options?</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-1 pt-2 text-[#a3c2e3]">
                                Yes, we offer flexible subscription plans that can be tailored to your needs. Choose from weekly,
                                bi-weekly, or monthly deliveries and pause or cancel anytime.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-7" className="border border-gray-800 rounded-lg overflow-hidden ">
                            <AccordionTrigger className="px-6 py-4 text-[#1c1c1c] hover:no-underline hover:bg-gray-800/50 data-[state=open]:bg-gray-800/50">
                                <span className="text-left font-medium">How do I customize my meals?</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-6  pt-2 text-[#a3c2e3]">
                                When selecting a meal, you will see customization options where you can adjust ingredients, portion sizes,
                                or dietary preferences. These changes will be saved for your specific order.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>


            </div>
        </section>
    )
}
