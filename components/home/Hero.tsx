/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";

export default function Hero() {
    const [email, setEmail] = useState("");

    const handleSubmit = async () => {
        const toastId = toast.loading("Submitting...");

        if (!email) {
            toast.error("Please enter your email.", { id: toastId });
            return;
        }

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

            if (!baseUrl) {
                throw new Error("API base URL is not configured.");
            }

            const response = await fetch(`${baseUrl}/notify`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Something went wrong.");
            }

            toast.success("You’ve been added to the waitlist!", { id: toastId });
            setEmail("");
        } catch (error: any) {
            toast.error(error.message || "Failed to submit. Try again.", { id: toastId });
        }
    };

    return (
        <section className="relative flex flex-col items-center justify-center py-20 lg:py-32 overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(100%_80%_at_50%_50%,rgba(56,189,248,0.15)_0%,rgba(255,255,255,0)_100%)]" />

            <div className="container px-4 text-center">
                <div className="inline-flex items-center rounded-full border border-accent-blue/30 bg-accent-blue/10 px-3 py-1 text-xs font-medium text-primary mb-8">
                    COMING SOON
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-dark-navy sm:text-6xl mb-6">
                    The Future of <span className="text-primary">Connection</span> <br />
                    is Coming Soon
                </h1>

                <p className="mx-auto max-w-150 text-gray-500 md:text-lg mb-10 leading-relaxed">
                    Experience a new standard of digital communication.
                </p>

                {/* Form */}
                <div className="mx-auto flex w-full max-w-md flex-col items-center space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                    <Input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 border-gray-200 focus-visible:ring-primary"
                    />

                    <Button
                        onClick={handleSubmit}
                        className="h-12 bg-primary hover:bg-primary/90 px-8 text-white"
                    >
                        Get Notified
                    </Button>
                </div>

                <p className="mt-4 text-xs text-gray-400">
                    Join 2,400+ people waiting for early access.
                </p>
            </div>
        </section>
    );
}