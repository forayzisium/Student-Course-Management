'use client';

import React, { useState } from 'react';
import StudentSidebar from '@/components/students/StudentSidebar';
import { PanelLeft } from 'lucide-react';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#EAE6DC] text-[#231F1D] flex font-sans antialiased selection:bg-[#B85328] selection:text-white">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Component */}
      <StudentSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-[#EAE5D9] border-b border-[#E0DACB] px-4 py-3 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 text-stone-700 hover:bg-stone-200/60 rounded-lg"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <span className="font-serif font-bold text-lg text-[#231F1D]">SCM</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#B85328] text-white font-bold flex items-center justify-center text-xs">
            SF
          </div>
        </header>

        <main className="flex-1 w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
