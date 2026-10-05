import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ClientIntlProvider } from "@/components/i18n/ClientIntlProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://callschat.com"),
  title: "CallsChat | The Future of Connection",
  description: "Ultra-high-quality voice calls and lightning-fast messaging.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0C1317] text-[#111B21] dark:text-[#E9EDEF] overflow-x-clip`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClientIntlProvider>
            <main className="flex-1">{children}</main>
            <Toaster position="top-right" richColors />
          </ClientIntlProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}