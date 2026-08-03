import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-white relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-28 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Editorial Grid */}
        <div className="lg:col-span-6 text-center lg:text-left">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F172A] tracking-tight leading-[1.1]">
            The Future of Student <br />
            <span className="text-[#2563EB]">Course Management</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg text-[#64748B] max-w-xl mx-auto lg:mx-0 leading-relaxed">
            A modern platform that streamlines course management, enrollment, assignments, results, payments, and AI-powered study assistance for students, teachers, and administrators.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link 
              href="/register" 
              className="px-7 py-3.5 text-sm font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1"
            >
              Get Started
            </Link>
            <a 
              href="#features" 
              className="px-7 py-3.5 text-sm font-bold text-[#0F172A] bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all duration-200 hover:-translate-y-1"
            >
              Explore Courses
            </a>
          </div>
        </div>

        {/* Right Dashboard Terminal UI Graphics */}
        <div className="lg:col-span-6 w-full max-w-xl mx-auto lg:max-w-none">
          <div className="bg-[#0F172A] rounded-2xl shadow-2xl p-6 border border-slate-800 relative group transition-all duration-300 hover:shadow-blue-500/10">
            {/* Top Mac Style Window Header Dots */}
            <div className="flex gap-2 mb-6 border-b border-slate-800 pb-4">
              <span className="w-3 h-3 rounded-full bg-rose-500 block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 block" />
              <span className="text-xs text-slate-500 font-mono ml-2">scms-terminal-v1.0.exe</span>
            </div>

            {/* Matrix Data Metrics Block */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block">Total Enrolled Students</span>
                <span className="text-2xl font-bold text-white mt-1 block">3,582</span>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block">Active Verified Courses</span>
                <span className="text-2xl font-bold text-[#06B6D4] mt-1 block">125</span>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block">Appointed Instructors</span>
                <span className="text-2xl font-bold text-white mt-1 block">87</span>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-semibold text-slate-400 block">Processed Capital Ledger</span>
                <span className="text-2xl font-bold text-emerald-400 mt-1 block">৳8.2M</span>
              </div>
            </div>

            {/* Performance Analytics Vector Component */}
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">System Optimization Metric</span>
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono">LIVE TRACKING</span>
              </div>
              <div className="h-16 flex items-end gap-2 pt-2">
                <div className="bg-blue-600 w-full h-8 rounded-sm animate-pulse" />
                <div className="bg-blue-500 w-full h-12 rounded-sm" />
                <div className="bg-[#06B6D4] w-full h-6 rounded-sm" />
                <div className="bg-blue-600 w-full h-14 rounded-sm animate-pulse" />
                <div className="bg-[#06B6D4] w-full h-9 rounded-sm" />
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
