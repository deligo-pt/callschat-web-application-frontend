// components/Navbar.tsx
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
    return (
        <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-center px-4">
                <Link href="/" className="flex items-center">
                    {/* Replace with your actual logo icon */}
                    <Image src="/calls_chat_logo.png" height={80} width={80} alt="logo" />
                    <span className="text-xl font-bold text-dark-navy">CallsChat</span>
                </Link>
            </div>
        </nav>
    );
}