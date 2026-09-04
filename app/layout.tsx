import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
export const metadata: Metadata = {
    title: "SCMS",
    description: "Student Course Management System",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">

            <body className="flex min-h-screen flex-col bg-[#f3f0e7]">
              <Navbar />
            <div className="flex flex-1 flex-col">{children}</div>
            <Footer />

            </body>
        </html>
    );
}