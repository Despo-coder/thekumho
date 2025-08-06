import Link from 'next/link'
import React from 'react'

const Footer = () => {
    return (
        <div>
            {/* Footer */}
            <footer className="bg-zinc-800 py-12 text-white border-t-4 border-orange-400 md:mt-16 ">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
                        {/* Company Description */}
                        <div>
                            <h3 className="mb-4 text-xl font-semibold text-orange-300">The Kumho Restaurant</h3>
                            <p className="text-gray-200 font-semibold">Japanese Cuisine</p>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="mb-4 text-xl font-semibold text-orange-300">Contact Us</h3>
                            <p className="text-gray-200 font-semibold">1471 Harmony Rd N</p>
                            <p className="text-gray-200 font-semibold">Food District, CA 90210</p>
                            <p className="text-gray-200 font-semibold">info@thekuhorestaurant.com</p>
                            <p className="text-gray-200 font-semibold">(555) 123-4567</p>
                        </div>

                        <div>
                            <h3 className="mb-4 text-xl font-semibold text-orange-300">Find Us</h3>
                            <div className="rounded-lg overflow-hidden w-full h-48 border-2 border-orange-300">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d5745.439968729745!2d-78.85140252316599!3d43.944468471089834!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89d51b48975f91af%3A0x959e8221aee8d3b3!2s1471%20Harmony%20Rd%20N%2C%20Oshawa%2C%20ON%20L1H%207K5!5e0!3m2!1sen!2sca!4v1747678349536!5m2!1sen!2sca"
                                    className="w-full h-full border-0"
                                    loading="lazy"
                                    allowFullScreen
                                    referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </div>

                        {/* Hours */}
                        <div>
                            <h3 className="mb-4 text-xl font-semibold text-orange-300">Hours</h3>
                            <p className="text-gray-200 font-semibold">Monday - Friday: 9am - 6pm</p>
                            <p className="text-gray-200 font-semibold">Saturday: 10am - 4pm</p>
                            <p className="text-gray-200 font-semibold">Sunday: Closed</p>
                        </div>

                        {/* Map */}

                    </div>

                    {/* Footer Bottom */}
                    <div className="mt-8 border-t border-orange-400 pt-8 text-center text-gray-300">
                        <p>&copy; {new Date().getFullYear()} The Kumho Restaurant. All rights reserved.</p>
                        <p>Powered by <Link href="https://wwww.opsedsolutions.com" className="text-orange-300">OPSED Solutions</Link></p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Footer
