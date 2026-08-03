"use client";

import Link from "next/link";
import { useState } from "react";

const links = [
    { name: "Home", href: "/" },
    { name: "Courses", href: "/courses" },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50">
            <nav className="mx-auto border border-white/20 bg-white/70 backdrop-blur-xl shadow-xl">
                <div className="flex h-16 items-center justify-between px-6">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-lg">
                            S
                        </div>

                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                SCMS
                            </h1>

                            <p className="text-xs text-gray-500">
                                Student Course Management
                            </p>
                        </div>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden lg:flex items-center gap-8">
                        {links.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="group relative text-gray-700 font-medium transition"
                            >
                                {item.name}

                                <span className="absolute left-0 -bottom-1 h-[2px] w-0 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                            </Link>
                        ))}
                    </div>

                    {/* Buttons */}
                    <div className="hidden lg:flex items-center gap-3">

                        <Link
                            href="/login"
                            className="rounded-xl border border-blue-600 px-5 py-2 font-medium text-blue-600 transition hover:bg-blue-50"
                        >
                            Login
                        </Link>

                        <Link
                            href="/register"
                            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 font-medium text-white shadow-lg transition hover:scale-105"
                        >
                            Register
                        </Link>

                    </div>

                    {/* Mobile Button */}
                    <button onClick={() => setOpen(!open)}
                        className="lg:hidden group flex items-center justify-center relative z-10 [transition:all_0.5s_ease] rounded-[0.375rem] p-[5px] cursor-pointer border border-[#999] outline-none focus-visible:outline-0">
                        <svg fill="currentColor" stroke="none" strokeWidth={0} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={`w-7 h-7 overflow-visible [transition:transform_.35s_ease] ${open ? "rotate-45" : ""
                            }`}>
                            <path className={`transition-transform duration-500 ${open
                                ? "[transform:rotate(112.5deg)_translate(-27.2%,-80.2%)]"
                                : ""
                                }`} d="m3.45,8.83c-.39,0-.76-.23-.92-.62-.21-.51.03-1.1.54-1.31L14.71,2.08c.51-.21,1.1.03,1.31.54.21.51-.03,1.1-.54,1.31L3.84,8.75c-.13.05-.25.08-.38.08Z" />
                            <path className={`transition-transform duration-500 ${open
                                ? "[transform:rotate(22.5deg)_translate(15.5%,-23%)]"
                                : ""
                                }`} d="m2.02,17.13c-.39,0-.76-.23-.92-.62-.21-.51.03-1.1.54-1.31L21.6,6.94c.51-.21,1.1.03,1.31.54.21.51-.03,1.1-.54,1.31L2.4,17.06c-.13.05-.25.08-.38.08Z" />
                            <path className={`transition-transform duration-500 ${open
                                ? "[transform:rotate(112.5deg)_translate(-15%,-149.5%)]"
                                : ""
                                }`} d="m8.91,21.99c-.39,0-.76-.23-.92-.62-.21-.51.03-1.1.54-1.31l11.64-4.82c.51-.21,1.1.03,1.31.54.21.51-.03,1.1-.54,1.31l-11.64,4.82c-.13.05-.25.08-.38.08Z" />
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`lg:hidden overflow-hidden border-t border-gray-200 transition-all duration-500 ease-in-out ${open
                        ? "max-h-[500px] opacity-100 py-5"
                        : "max-h-0 opacity-0 py-0 border-t-0"
                        }`}
                >
                    <div className="px-6 flex flex-col gap-5">

                        {links.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className="font-medium text-gray-700 hover:text-blue-600"
                            >
                                {item.name}
                            </Link>
                        ))}

                        <div className="flex gap-3 pt-4">
                            <Link
                                href="/login"
                                className="flex-1 rounded-lg border border-blue-600 py-2 text-center font-medium text-blue-600"
                            >
                                Login
                            </Link>

                            <Link
                                href="/register"
                                className="flex-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 py-2 text-center font-medium text-white"
                            >
                                Register
                            </Link>
                        </div>

                    </div>
                </div>
            </nav>
        </header>
    );
}