import React from 'react';

export default function AISection() {
  const analyticalPoints = [
    "Personalized Weekly Study Schedules",
    "Continuous Weak-Subject Metric Detection",
    "Interactive Quiz Insight Mapping",
    "Tailored Skill Reinforcement Suggestions"
  ];

  return (
    <section id="ai" className="bg-white py-20 lg:py-28 border-b border-slate-100 relative overflow-hidden">
      {/* Background Soft Sky Blue Decorative Bulb */}
      <div className="absolute top-1/2 left-full -translate-x-1/3 -translate-y-1/2 w-[35rem] h-[35rem] bg-gradient-to-tr from-cyan-400/5 via-blue-600/5 to-transparent blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Informative Content Grid */}
        <div className="lg:col-span-6">
          <span className="text-xs font-bold text-cyan-600 uppercase tracking-widest bg-cyan-50 px-3 py-1 rounded-md">
            INTELLIGENCE LAYER
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight leading-tight mt-4 mb-6">
            AI-Driven Study Optimization Engine
          </h2>
          <p className="text-[#64748B] text-base sm:text-lg leading-relaxed mb-8">
            Process performance timelines automatically. Students input active study durations, assignment statuses, and quiz marks to receive immediate behavioral tuning strategies.
          </p>

          <ul className="space-y-4">
            {analyticalPoints.map((point, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-cyan-50 flex items-center justify-center border border-cyan-100 shrink-0">
                  <svg className="w-3.5 h-3.5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-[#0F172A]">{point}</span>
              </div>
            ))}
          </ul>
        </div>

        {/* Right Graphical AI UI Panel */}
        <div className="lg:col-span-6">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-8 shadow-2xl text-white">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center font-mono text-sm font-bold text-slate-950">
                AI
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight block">Cognitive Inference Panel</span>
                <span className="text-[10px] text-cyan-400 tracking-wider font-mono font-bold block uppercase mt-0.5">Gemini / OpenAI API Connect</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/80">
                <span className="text-xs font-mono text-slate-400 block">// WEAKNESS REGISTRY IDENTIFIED</span>
                <span className="text-sm font-bold text-cyan-300 mt-1 block">Advanced Data Structures (Recursion Arrays)</span>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-4 border border-slate-800/80">
                <span className="text-xs font-mono text-slate-400 block">// RECCOMMENDED CORE ADJUSTMENT</span>
                <span className="text-sm font-bold text-white mt-1 block">Allocate +2.5Hrs to targeted graph operations</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
