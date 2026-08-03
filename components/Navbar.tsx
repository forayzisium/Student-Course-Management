import React from 'react';
import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-slate-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-[#2563EB] flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:bg-[#1D4ED8] transition-colors duration-200">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 14l9-5-9-4-9 4 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <span className="font-bold text-xl tracking-tight text-[#0F172A]">SCMS</span>
        </Link>

        {/* Center Nav Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#64748B]">
          <a href="#features" className="hover:text-[#2563EB] transition-colors duration-200">Features</a>
          <a href="#roles" className="hover:text-[#2563EB] transition-colors duration-200">Dashboard Matrix</a>
          <a href="#ai" className="hover:text-[#2563EB] transition-colors duration-200">AI Workspace</a>
        </div>

        {/* Right Auth Access Control */}
        <div className="flex items-center gap-3">
          <Link 
            href="/login" 
            className="px-4 py-2 text-sm font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-slate-50 rounded-lg transition-all duration-200"
          >
            Login
          </Link>
          <Link 
            href="/register" 
            className="px-4 py-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
