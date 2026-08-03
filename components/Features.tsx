import React from 'react';

export default function Features() {
  const items = [
    {
      icon: "📚",
      title: "Course Engineering",
      desc: "Architect curriculum design pathways smoothly. Sort and manage modules cleanly across categorical divisions."
    },
    {
      icon: "📝",
      title: "Assignment Submission",
      desc: "Robust workflow portals facilitating rapid student project uploads and direct teacher feedback loops."
    },
    {
      icon: "🎯",
      title: "Grade Indexing",
      desc: "Central evaluations tracker managing continuous assessment scores and live automated GPA calculations."
    },
    {
      icon: "🎓",
      title: "Dynamic Enrollment",
      desc: "Browse premium catalog entries and lock in registrations with automated system entry logging."
    },
    {
      icon: "💳",
      title: "SSLCommerz Terminal",
      desc: "Fully integrated payment gateways enabling instant fee resolution and automated downloadable receipts."
    },
    {
      icon: "🤖",
      title: "AI Cognitive Layer",
      desc: "Neural processing pipelines monitoring weekly hours to generate custom study plans and feedback."
    }
  ];

  return (
    <section id="features" className="bg-white py-20 lg:py-28 border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Title Grid */}
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#2563EB] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-md">
            Platform Capabilities
          </span>
          <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mt-4">
            System Specification Array
          </h2>
        </div>

        {/* 6-Card Layout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-xl border border-slate-200/80 p-8 shadow-sm hover:shadow-xl hover:border-[#2563EB] hover:scale-105 transition-all duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 text-2xl rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
                  {item.icon}
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] mb-3 group-hover:text-[#2563EB] transition-colors duration-200">
                  {item.title}
                </h3>
                <p className="text-[#64748B] text-sm leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-mono font-bold tracking-wider text-slate-400">
                <span>SCMS ENGINE LAYER</span>
                <span>SECURE // RUN</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
