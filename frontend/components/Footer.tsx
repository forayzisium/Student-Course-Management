import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-20 w-full">
      <div className="w-full overflow-hidden bg-[#171510] text-white">
        <div className="grid gap-10 px-6 py-12 sm:grid-cols-2 sm:px-10 lg:grid-cols-[2fr_1fr_1fr] lg:px-12 lg:py-16">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#45413D] shadow-lg shadow-dark/10">
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
                <p className="text-xl font-normal tracking-tight text-white/90 font-serif">
                  SC<span className="text-[#B45A2A]">M</span>
                </p>

                <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#F2E9D8] font-inter">
                  Course Management
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-[#F2E9D8] font-inter">
              A simple and modern platform for students and teachers to manage
              courses, learning activities, and academic information in one
              place.
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <h3 className="mb-5 font-inter text-sm font-semibold text-[#F2E9D8]">
              Explore
            </h3>

            <div className="flex flex-col gap-3 font-inter">
              <FooterLink href="/home">Home</FooterLink>
              <FooterLink href="/courses">Courses</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/contact">Contact</FooterLink>
            </div>
          </nav>

          <div>
            <h3 className="mb-5 text-sm font-semibold text-[#F2E9D8] font-inter">
              Account
            </h3>

            <div className="flex flex-col gap-3 font-inter">
              <FooterLink href="/login">Sign In</FooterLink>

              <FooterLink href="/register">Create Account</FooterLink>
            </div>
          </div>
        </div>

        <div className="mx-6 border-t border-slate-800 sm:mx-10 lg:mx-12" />

        <div className="flex flex-col gap-5 px-6 py-6 font-inter sm:px-10 md:flex-row md:items-center md:justify-between lg:px-12">
          <p className="text-center text-xs text-[#F2E9D8] md:text-left">
            &copy; 2026 SCM. All rights reserved.
          </p>

          <div className="flex items-center justify-center gap-2 text-xs text-[#F2E9D8]">
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
