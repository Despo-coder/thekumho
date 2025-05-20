"use client";

import { useState } from "react";
// import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function ReservationPage() {
    const { data: session } = useSession();
    //const router = useRouter();
    const user = session?.user;
    const [formData, setFormData] = useState({
        customerName: session?.user?.name || "",
        email: session?.user?.email || "",
        phone: "",
        partySize: 2,
        bookingDate: "",
        bookingTime: "",
        specialRequest: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess(false);

        // Validate date and time
        const bookingDateTime = new Date(`${formData.bookingDate}T${formData.bookingTime}`);
        if (bookingDateTime <= new Date()) {
            setError("Please select a future date and time");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/bookings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    customerName: formData.customerName,
                    email: formData.email,
                    phone: formData.phone,
                    partySize: parseInt(formData.partySize.toString()),
                    bookingTime: bookingDateTime.toISOString(),
                    specialRequest: formData.specialRequest,
                    userId: session?.user?.id,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to create reservation");
            }

            setSuccess(true);
            // Reset form except user info
            setFormData((prev) => ({
                ...prev,
                partySize: 2,
                bookingDate: "",
                bookingTime: "",
                specialRequest: "",
            }));
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("An error occurred while creating your reservation");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Create array of available time slots
    const timeSlots = [];
    for (let hour = 11; hour <= 21; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
            timeSlots.push(timeString);
        }
    }

    // Get today's date in YYYY-MM-DD format for min attribute
    const today = new Date().toISOString().split("T")[0];

    // Calculate max date (6 months from now)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 6);
    const maxDateString = maxDate.toISOString().split("T")[0];

    return (
        <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-center mb-8">Make a Reservation</h1>

            {!user && (<>
                <div className="mb-8 bg-orange-500 border border-red-200 text-white rounded-lg p-4 container mx-auto max-w-3xl">
                    <Link href='/login'>
                        <p className="font-medium text-center">Please <span className="font-bold ">login </span>to book a table</p>
                    </Link>

                </div>
            </>)}

            {success && (
                <div className="mb-8 bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
                    <p className="font-medium">Reservation submitted successfully!</p>
                    <p className="text-sm mt-1">
                        We will confirm your reservation shortly. You will receive a confirmation email.
                    </p>
                </div>
            )}

            {error && (
                <div className="mb-8 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                    <p className="font-medium">Error</p>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}

            <div className="max-w-3xl mx-auto bg-white shadow-sm rounded-lg p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name *
                            </label>
                            <input
                                type="text"
                                id="customerName"
                                name="customerName"
                                value={formData.customerName}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="partySize" className="block text-sm font-medium text-gray-700 mb-1">
                                Party Size *
                            </label>
                            <select
                                id="partySize"
                                name="partySize"
                                value={formData.partySize}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((size) => (
                                    <option key={size} value={size}>
                                        {size} {size === 1 ? "person" : "people"}
                                    </option>
                                ))}
                                <option value="11">More than 10 (Please specify in notes)</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="bookingDate" className="block text-sm font-medium text-gray-700 mb-1">
                                Date *
                            </label>
                            <input
                                type="date"
                                id="bookingDate"
                                name="bookingDate"
                                value={formData.bookingDate}
                                onChange={handleChange}
                                min={today}
                                max={maxDateString}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>

                        <div>
                            <label htmlFor="bookingTime" className="block text-sm font-medium text-gray-700 mb-1">
                                Time *
                            </label>
                            <select
                                id="bookingTime"
                                name="bookingTime"
                                value={formData.bookingTime}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            >
                                <option value="">Select a time</option>
                                {timeSlots.map((time) => (
                                    <option key={time} value={time}>
                                        {time}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="specialRequest" className="block text-sm font-medium text-gray-700 mb-1">
                            Special Requests (Optional)
                        </label>
                        <textarea
                            id="specialRequest"
                            name="specialRequest"
                            value={formData.specialRequest}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-orange-500 focus:border-orange-500"
                            placeholder="Please let us know if you have any special requirements or preferences"
                        />
                    </div>
                    {user ? (
                        <div className="text-right">
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-6 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {isLoading ? "Processing..." : "Book Table"}
                            </button>
                        </div>

                    ) : (

                        <div className="text-right">

                            {/* Leave Blank if there is no session */}
                        </div>
                    )}

                </form>
            </div>
        </div>
    );
} 