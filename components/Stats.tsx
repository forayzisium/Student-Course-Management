import React from 'react';

export default function Stats() {
  const metrics = [
    { value: "100+", label: "Academic Courses" },
    { value: "5000+", label: "Verified Students" },
    { value: "250+", label: "Appointed Teachers" },
    { value: "24/7", label: "AI Cognitive Nodes" }
  ];

  return (
    <section className="bg-slate-50 border-b border-slate-200/60 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {metrics.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-black text-[#0F172A] tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[#64748B] mt-2 tracking-wide uppercase font-mono">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
