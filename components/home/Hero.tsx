
import { Button } from "../ui/button";
import { Input } from "../ui/input";


export default function Hero() {
    return (
        <section className="relative flex flex-col items-center justify-center py-20 lg:py-32 overflow-hidden">
            {/* Background Subtle Gradient */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(100%_80%_at_50%_50%,rgba(56,189,248,0.15)_0%,rgba(255,255,255,0)_100%)]" />

            <div className="container px-4 text-center">
                {/* Badge */}
                <div className="inline-flex items-center rounded-full border border-accent-blue/30 bg-accent-blue/10 px-3 py-1 text-xs font-medium text-primary mb-8">
                    COMING SOON
                </div>

                {/* Headline */}
                <h1 className="text-4xl font-extrabold tracking-tight text-dark-navy sm:text-6xl mb-6">
                    The Future of <span className="text-primary">Connection</span> <br />
                    is Coming Soon
                </h1>

                {/* Sub-headline */}
                <p className="mx-auto max-w-150 text-gray-500 md:text-lg mb-10 leading-relaxed">
                    Experience a new standard of digital communication. CallsChat combines
                    ultra-high-quality voice calls with lightning-fast messaging in a beautifully
                    minimal interface.
                </p>

                {/* Waitlist Form */}
                <div className="mx-auto flex w-full max-w-md flex-col items-center space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
                    <Input
                        type="email"
                        placeholder="Enter your email address"
                        className="h-12 border-gray-200 focus-visible:ring-primary"
                    />
                    <Button className="h-12 bg-primary hover:bg-primary/90 px-8 text-white">
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