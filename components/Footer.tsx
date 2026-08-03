import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          
          {/* Col 1: Identity */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-bold text-lg tracking-tight text-[#0F172A] block mb-4">SCMS</span>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-xs">
              Centralized architecture engineered to resolve course logging, assignment tracking, secure token validation, and cognitive AI metrics.
            </p>
          </div>

          {/* Col 2: Hub Navigation */}
          <div>
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block mb-4">Quick Links</span>
            <ul className="space-y-2.5 text-sm font-semibold text-[#64748B]">
              <li><a href="#" className="hover:text-[#2563EB] transition-colors">Home</a></li>
              <li><a href="#features" className="hover:text-[#2563EB] transition-colors">Features</a></li>
              <li><Link href="/login" className="hover:text-[#2563EB] transition-colors">Portal Login</Link></li>
            </ul>
          </div>

          {/* Col 3: Modules Array */}
          <div>
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block mb-4">Resources</span>
            <ul className="space-y-2.5 text-sm font-semibold text-[#64748B]">
              <li><a href="#roles" className="hover:text-[#2563EB] transition-colors">Dashboards</a></li>
              <li><a href="#ai" className="hover:text-[#2563EB] transition-colors">AI Core</a></li>
            </ul>
          </div>

          {/* Col 4: Network Target */}
          <div>
            <span className="text-xs font-bold text-[#0F172A] uppercase tracking-wider block mb-4">Contact</span>
            <ul className="space-y-2.5 text-sm font-semibold text-[#64748B]">
              <li className="text-xs text-[#64748B]">System Terminal Access Control</li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#2563EB] transition-colors">GitHub Repository</a></li>
            </ul>
          </div>

        </div>

        {/* Closing Ribbon */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-400">
          <span>&copy; 2026 Student Course Management System. All system privileges reserved.</span>
          <span>Engineered with Next.js & Tailwind Graphics Matrix</span>
        </div>
      </div>
    </footer>
  );
}
