import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  subtitle?: string;
  icon: React.ReactNode;
}

export default function StatCard({
  title,
  value,
  description,
  subtitle,
  icon,
}: StatCardProps) {
  const subText = description || subtitle || '';

  return (
    <div className="bg-white rounded-2xl p-5 border border-[#E9E4D9] shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-center justify-between min-w-0">
      <div className="space-y-1 min-w-0 flex-1 pr-2">
        <span className="text-xs font-bold text-stone-400 uppercase tracking-wider block truncate">
          {title}
        </span>
        <span className="text-2xl sm:text-3xl font-bold text-[#231F1D] block">
          {value}
        </span>
        {subText && (
          <span className="text-xs text-stone-500 block truncate">
            {subText}
          </span>
        )}
      </div>
      <div className="w-11 h-11 rounded-xl bg-[#F4F0E8] text-[#B85328] flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
  );
}
