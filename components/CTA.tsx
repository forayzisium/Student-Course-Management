import React from 'react';
import Link from 'next/link';

export default function CTA() {
  return (
    <section className="bg-white py-20 lg:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] rounded-2xl p-10 sm:p-16 text-center relative overflow-hidden shadow-xl shadow-blue-600/10">
          
          {/* Subtle design geometry shape */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl translate-x-20 -translate-y-20 pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Ready to transform your learning experience?
            </h2>
            <p className="mt-4 text-base text-blue-100 max-w-md mx-auto">
              Initialize your administrative portal, student hub, or faculty registry workspace with our centralized management blueprint.
            </p>
            <div className="mt-8">
              <Link 
                href="/register" 
                className="inline-block px-8 py-4 font-bold text-[#2563EB] bg-white hover:bg-slate-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
              >
                Start Learning →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
