
import Link from "next/link";
import { Share2, AtSign } from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full border-t border-gray-100 py-6 bg-white">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-bold text-dark-navy">CallsChat</span>
                    <span>© 2026 CallsChat. All rights reserved.</span>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                    <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
                    <Link href="#" className="hover:text-primary transition-colors">Contact Us</Link>

                    <div className="flex items-center gap-2 ml-4">
                        <button className="p-2 rounded-full border border-gray-100 hover:bg-gray-50 transition-colors">
                            <Share2 className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-full border border-gray-100 hover:bg-gray-50 transition-colors">
                            <AtSign className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}