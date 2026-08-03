import React from 'react';

export default function RoleCards() {
  const roles = [
    {
      title: "Student Workspace",
      color: "border-blue-200 hover:border-blue-500",
      indicator: "bg-blue-600",
      actions: ["Instant Course Enrollment", "Assignment Submission Hub", "Live Performance & Grades Tracker", "Secure SSLCommerz Payment Portals"]
    },
    {
      title: "Instruction Faculty",
      color: "border-emerald-200 hover:border-emerald-500",
      indicator: "bg-emerald-500",
      actions: ["Syllabus & Course Engineering", "Continuous Task Distribution", "Precision Metrics Grading Sheets", "Active Student Registry Logs"]
    },
    {
      title: "Administration Core",
      color: "border-rose-200 hover:border-rose-500",
      indicator: "bg-rose-500",
      actions: ["System User Controls & Registry", "Global Structural Modifications", "Financial Settlement Supervision", "Comprehensive Analytics Reporting"]
    }
  ];

  return (
    <section id="roles" className="bg-slate-50 py-20 lg:py-28 border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs font-bold text-[#2563EB] uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-md">
            Access Provisioning
          </span>
          <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mt-4">
            Role-Based Matrix Controls
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roles.map((role, idx) => (
            <div 
              key={idx}
              className={`bg-white rounded-2xl border p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${role.color}`}
            >
              <h3 className="text-xl font-bold text-[#0F172A] mb-6 flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full block ${role.indicator}`} />
                {role.title}
              </h3>
              <ul className="space-y-4">
                {role.actions.map((act, actIdx) => (
                  <li key={actIdx} className="flex items-start gap-3 text-sm font-medium text-[#64748B]">
                    <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    {act}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
