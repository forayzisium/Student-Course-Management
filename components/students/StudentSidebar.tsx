'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutGrid,
  BookOpen,
  CheckSquare,
  BarChart3,
  User,
  Settings,
  FileText,
  Globe,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  GraduationCap,
  ChevronUp,
} from 'lucide-react';

interface StudentSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function StudentSidebar({
  sidebarOpen,
  setSidebarOpen,
}: StudentSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile popup menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { name: 'Dashboard', href: '/student/dashboard', icon: LayoutGrid },
    { name: 'My Courses', href: '/student/courses', icon: BookOpen },
    { name: 'Assignments', href: '/student/assignments', icon: CheckSquare },
    { name: 'Results', href: '/student/results', icon: BarChart3 },
  ];

  const handleLogout = () => {
    setProfileMenuOpen(false);
    alert('You have been logged out.');
    router.push('/');
  };

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 bg-[#EAE5D9] border-r border-[#E0DACB] transition-all duration-300 flex flex-col justify-between p-4 shrink-0 ${
        sidebarOpen
          ? 'w-64 translate-x-0'
          : '-translate-x-full lg:translate-x-0 lg:w-20'
      }`}
    >
      <div className="space-y-6">
        {/* Brand Logo & Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Clickable Logo Button to expand/collapse */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-10 h-10 rounded-full bg-[#B85328] text-white flex items-center justify-center shadow-sm shrink-0 hover:bg-[#a3471f] transition-all"
              title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <GraduationCap className="w-5 h-5" />
            </button>
            {sidebarOpen && (
              <div className="flex items-baseline font-serif text-2xl font-bold tracking-tight text-[#231F1D]">
                SC<span className="text-[#B85328]">M</span>
              </div>
            )}
          </div>

          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-stone-500 hover:text-stone-800 p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="space-y-1.5">
          {sidebarOpen && (
            <p className="text-[11px] font-bold text-stone-400 uppercase tracking-widest px-3 mb-3">
              Menu
            </p>
          )}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === '/student/courses' && pathname?.includes('/courses')) ||
              (item.href === '/student/dashboard' && pathname?.includes('/dashboard'));

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center ${
                  sidebarOpen ? 'justify-between px-4' : 'justify-center px-0'
                } py-3 rounded-2xl font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-[#B85328] text-white shadow-sm'
                    : 'text-stone-700 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
                title={item.name}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-stone-600'}`} />
                  {sidebarOpen && <span>{item.name}</span>}
                </div>
                {isActive && sidebarOpen && (
                  <span className="w-2.5 h-2.5 rounded-full bg-white shrink-0 shadow-xs" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile & Popover Menu */}
      <div className="relative pt-4 border-t border-[#E0DACB]/80" ref={profileMenuRef}>
        {/* Profile Clickable Button */}
        <button
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className={`w-full flex items-center ${
            sidebarOpen ? 'justify-between px-3' : 'justify-center px-0'
          } py-2 rounded-2xl hover:bg-stone-200/60 transition-colors text-left group`}
          title="User Menu"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-full bg-[#B85328] text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              SF
            </div>
            {sidebarOpen && (
              <div className="overflow-hidden">
                <p className="font-serif font-bold text-sm text-[#231F1D] truncate leading-snug">
                  forayzi sium
                </p>
                <p className="text-xs text-stone-500 font-medium leading-none mt-0.5">
                  Student
                </p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <ChevronUp
              className={`w-4 h-4 text-stone-500 transition-transform duration-200 ${
                profileMenuOpen ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>

        {/* Clickable Profile Popover Menu */}
        {profileMenuOpen && (
          <div
            className={`absolute bottom-full mb-3 bg-white border border-[#E0DACB] rounded-2xl shadow-xl z-50 p-4 w-64 animate-in fade-in slide-in-from-bottom-2 duration-150 ${
              sidebarOpen ? 'left-0' : 'left-0 sm:left-full sm:ml-2'
            }`}
          >
            {/* Profile Card Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
              <div className="w-11 h-11 rounded-full bg-[#B85328] text-white font-bold flex items-center justify-center text-base shadow-sm shrink-0">
                SF
              </div>
              <div className="overflow-hidden">
                <p className="font-serif font-bold text-base text-[#231F1D] truncate leading-snug">
                  Forayzi Sium
                </p>
                <p className="text-xs text-stone-500 font-medium truncate">
                  student@scm.edu
                </p>
              </div>
            </div>

            {/* Upper Options */}
            <div className="py-2 space-y-1">
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  alert('Navigating to Your Profile');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#231F1D] hover:bg-stone-100 transition-colors"
              >
                <User className="w-4 h-4 text-stone-500" />
                <span>Your Profile</span>
              </button>
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  alert('Navigating to Account Settings');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#231F1D] hover:bg-stone-100 transition-colors"
              >
                <Settings className="w-4 h-4 text-stone-500" />
                <span>Account Settings</span>
              </button>
            </div>

            {/* Separator Line */}
            <hr className="my-1 border-stone-200" />

            {/* Lower Options */}
            <div className="py-2 space-y-1">
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  alert('Terms and Conditions');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#231F1D] hover:bg-stone-100 transition-colors"
              >
                <FileText className="w-4 h-4 text-stone-500" />
                <span>Terms and Conditions</span>
              </button>
              <a
                href="https://university.edu"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setProfileMenuOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-[#231F1D] hover:bg-stone-100 transition-colors"
              >
                <Globe className="w-4 h-4 text-stone-500" />
                <span>University Website</span>
              </a>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors mt-1"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
