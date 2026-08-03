import Link from "next/link";

export default function Footer() {

    return (
        <footer className="mt-20 px-4 pb-4">
            <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-slate-950 text-white">

                {/* Main Footer */}
                <div className="grid gap-12 px-6 py-12 sm:px-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-12 lg:py-16">

                    {/* Brand */}
                    <div>
                        <Link href="/" className="inline-flex items-center gap-3">
                            {/* Logo Icon */}
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
                                <svg
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="h-6 w-6 text-white"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M12 14L3 9l9-5 9 5-9 5Z"
                                    />

                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M7 12v5c3 2 7 2 10 0v-5"
                                    />
                                </svg>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold tracking-tight">SCMS</h2>

                                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                                    Course Management
                                </p>
                            </div>
                        </Link>

                        <p className="mt-5 max-w-sm text-sm leading-6 text-slate-400">
                            A simple and modern platform for students and teachers to
                            manage courses, learning activities, and academic information
                            in one place.
                        </p>

                        {/* Status */}
                        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900 px-4 py-2">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>

                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                            </span>

                            <span className="text-xs font-medium text-slate-300">
                                System Online
                            </span>
                        </div>
                    </div>

                    {/* Account */}
                    <div>
                        <h3 className="mb-5 text-sm font-semibold text-white">
                            Account
                        </h3>

                        <div className="flex flex-col gap-3">
                            <FooterLink href="/login">Sign In</FooterLink>

                            <FooterLink href="/register">
                                Create Account
                            </FooterLink>

                        </div>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="mb-5 text-sm font-semibold text-white">
                            Support
                        </h3>

                        <div className="flex flex-col gap-3">
                            <FooterLink href="/about">About SCMS</FooterLink>

                            <FooterLink href="/contact">Contact</FooterLink>

                            <FooterLink href="/help">Help Center</FooterLink>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="mx-6 border-t border-slate-800 sm:mx-10 lg:mx-12" />

                {/* Bottom Footer */}
                <div className="flex flex-col gap-5 px-6 py-6 sm:px-10 md:flex-row md:items-center md:justify-between lg:px-12">

                    {/* Copyright */}
                    <p className="text-center text-xs text-slate-500 md:text-left">
                        © 2026 SCMS. All rights reserved.
                    </p>

                    {/* Made for Education */}
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                        <span>Built for</span>

                        <span className="rounded-full bg-indigo-500/10 px-3 py-1 font-medium text-indigo-400">
                            Students
                        </span>

                        <span>&</span>

                        <span className="rounded-full bg-violet-500/10 px-3 py-1 font-medium text-violet-400">
                            Teachers
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}


/* Reusable Footer Link */

function FooterLink({
    href,
    children,
}: {
    href: string;
    children: React.ReactNode;
}) {
    return (
        <Link
            href={href}
            className="group flex w-fit items-center gap-2 text-sm text-slate-400 transition-colors duration-300 hover:text-white"
        >
            <span className="h-1 w-1 rounded-full bg-slate-700 transition-all duration-300 group-hover:w-3 group-hover:bg-indigo-500" />

            {children}
        </Link>
    );
}