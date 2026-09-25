"use client";

import { useAuth } from "@/lib/auth-context";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useState, useSyncExternalStore } from "react";

const SIDEBAR_STORAGE_KEY = "student-sidebar-collapsed";

function getSidebarSnapshot(): boolean {
  try {
    const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return raw === null ? true : raw === "true";
  } catch {
    return true;
  }
}

function subscribeSidebar(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

const navItems = [
  {
    name: "Dashboard",
    href: "/student/dashboard",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    name: "My Courses",
    href: "/student/courses",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5Z"
        />
        <path strokeLinecap="round" d="M8 7h8M8 11h8M8 15h5" />
      </svg>
    ),
  },
  {
    name: "Assignments",
    href: "/student/assignments",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5h6M9 3h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 13 2 2 4-4" />
      </svg>
    ),
  },
  {
    name: "Results",
    href: "/student/results",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 17v-4M12 17V9M16 17v-7"
        />
      </svg>
    ),
  },
  {
    name: "Attendance",
    href: "/student/attendance",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5h6M9 3h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 13 2 2 4-4" />
      </svg>
    ),
  },
  {
    name: "Pay Fees",
    href: "/student/payFees",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <rect
          x="3"
          y="6"
          width="18"
          height="12"
          rx="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <circle cx="12" cy="12" r="3" />

        <path
          strokeLinecap="round"
          d="M12 10.5v3M13 11h-1.5a1 1 0 0 0 0 2H13a1 1 0 0 1 0 2h-2"
        />
      </svg>
    ),
  },
  {
    name: "AI Study",
    href: "/student/ai-study",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"
        />

        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
];

export default function StudentSidebar() {
  const { logout, user } = useAuth();
  const pathname = usePathname();

  const [collapsedProfileMenuOpen, setCollapsedProfileMenuOpen] =
    useState(false);

  const [expandedProfileMenuOpen, setExpandedProfileMenuOpen] = useState(false);

  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    () => true,
  );

  const updateCollapsed = useCallback((value: boolean) => {
    setCollapsedProfileMenuOpen(false);
    setExpandedProfileMenuOpen(false);

    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: SIDEBAR_STORAGE_KEY,
        newValue: String(value),
      }),
    );
  }, []);

  const userName = user?.name || "Student";

  const userInitials =
    userName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "ST";

  const userRole = user?.role
    ? user.role.charAt(0) + user.role.slice(1).toLowerCase()
    : "Student";

  const handleLogout = logout;

  return (
    <aside
      className={`sticky top-0 z-50 flex h-screen shrink-0 flex-col border-r border-slate-300 bg-[#F0EDE4] transition-all duration-300 ${
        collapsed ? "w-16" : "w-56"
      }`}
    >

      <div
        className={`relative flex h-20 shrink-0 items-center border-b border-slate-200 shadow-sm shadow-[#45413D]/10 ${
          collapsed ? "justify-center px-3" : "gap-3 px-6"
        }`}
      >

        {collapsed ? (
          <div className="group relative h-8 w-8">

            <div
              className="
                                absolute inset-0
                                flex h-8 w-8 items-center justify-center
                                rounded-xl
                                bg-[#B45A2A]
                                text-white
                                shadow-lg
                                shadow-[#45413D]/10
                                transition-all duration-200
                                group-hover:opacity-0
                            "
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 14 3 9l9-5 9 5-9 5Z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 12v5c3 2 7 2 10 0v-5"
                />
              </svg>
            </div>


            <button
              type="button"
              onClick={() => updateCollapsed(false)}
              aria-label="Expand sidebar"
              className="
                                absolute inset-0
                                flex h-8 w-8 items-center justify-center
                                rounded-xl
                                bg-[#B45A2A]
                                text-white
                                shadow-lg
                                shadow-[#45413D]/10
                                opacity-0
                                transition-all duration-200
                                group-hover:opacity-100
                            "
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />

                <path strokeLinecap="round" d="M9 4v16" />
              </svg>
            </button>
          </div>
        ) : (
          <>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#B45A2A] text-white shadow-lg shadow-[#45413D]/10">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 14 3 9l9-5 9 5-9 5Z"
                />

                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7 12v5c3 2 7 2 10 0v-5"
                />
              </svg>
            </div>


            <div className="min-w-0">
              <p className="whitespace-nowrap font-serif text-lg font-normal tracking-tight text-[#333333]">
                SC
                <span className="text-[#B45A2A]">M</span>
              </p>
            </div>


            <button
              type="button"
              onClick={() => updateCollapsed(true)}
              aria-label="Collapse sidebar"
              className="
                                absolute
                                right-1.5
                                top-1/2
                                flex h-8 w-8
                                -translate-y-1/2
                                items-center justify-center
                                rounded-md
                                text-[#333333]
                                transition
                                hover:bg-[#B45A2A]/90
                                hover:text-white
                            "
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />

                <path strokeLinecap="round" d="M9 4v16" />
              </svg>
            </button>
          </>
        )}
      </div>


      <nav className="flex-1 overflow-y-auto px-3 py-6">

        <div
          className={`mb-3 overflow-hidden transition-all duration-200 ${
            collapsed ? "h-0 opacity-0" : "h-4 opacity-100"
          }`}
        >
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Menu
          </p>
        </div>

        <div className="space-y-1.5 font-inter">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={`group flex items-center rounded-xl py-3 text-sm font-medium transition-all duration-200 ${
                  collapsed ? "justify-center px-3" : "gap-3 px-3"
                } ${
                  isActive
                    ? "bg-[#B45A2A] text-white shadow-md shadow-orange-100"
                    : "text-slate-600 hover:bg-[#6F4E37]/30 hover:text-slate-900"
                }`}
              >

                <span
                  className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive
                      ? "text-white"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                >
                  {item.icon}
                </span>


                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${
                    collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  }`}
                >
                  {item.name}
                </span>


                {!collapsed && isActive && (
                  <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>


      <div
        className={`relative border-t border-slate-300 shadow-[0_2px_6px_rgba(0,0,0,0.04)] ${
          collapsed ? "p-2" : "p-4"
        }`}
      >

        {collapsed && collapsedProfileMenuOpen && (
          <div
            className="
                                absolute
                                bottom-full
                                left-2
                                z-[100]
                                mb-2
                                w-[253px]
                                overflow-hidden
                                rounded-[20px]
                                bg-[#363636]
                                text-white
                                shadow-2xl
                            "
          >

            <div className="px-4 pt-4">
              <div className="flex items-center gap-3 rounded-xl p-1">

                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B45A2A] text-xs font-medium text-white">
                  {userInitials}
                </div>


                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {userName}
                  </p>

                  <p className="truncate text-sm text-gray-400">{userRole}</p>
                </div>
              </div>
            </div>

            <div className="mx-4 my-4 border-t border-white/15" />


            <div className="px-2 pb-2">

              <Link
                href="/student/profile"
                onClick={() => setCollapsedProfileMenuOpen(false)}
                className="
                                        flex w-full items-center gap-3
                                        rounded-lg px-2 py-2.5
                                        text-sm text-gray-100
                                        transition hover:bg-white/10
                                    "
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="8" r="3.5" />

                  <path
                    strokeLinecap="round"
                    d="M5 20c.7-3.3 3.2-5.5 7-5.5s6.3 2.2 7 5.5"
                  />
                </svg>

                <span>Profile</span>
              </Link>


              <Link
                href="/student/settings"
                onClick={() => setCollapsedProfileMenuOpen(false)}
                className="
                                        flex w-full items-center gap-3
                                        rounded-lg px-2 py-2.5
                                        text-sm text-gray-100
                                        transition hover:bg-white/10
                                    "
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>

                <span>Settings</span>
              </Link>
            </div>

            <div className="mx-4 border-t border-white/15" />


            <div className="px-2 py-2">
              <button
                type="button"
                onClick={handleLogout}
                className="
                                        flex w-full items-center gap-3
                                        rounded-lg px-2 py-2.5
                                        text-left text-sm text-gray-100
                                        transition hover:bg-white/10
                                    "
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 17l5-5-5-5"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 12H3"
                  />

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 19V5a2 2 0 0 0-2-2h-6"
                  />
                </svg>

                <span>Log out</span>
              </button>
            </div>
          </div>
        )}


        <button
          type="button"
          onClick={() => {
            if (collapsed) {
              setExpandedProfileMenuOpen(false);
              setCollapsedProfileMenuOpen((prev) => !prev);
            } else {
              setCollapsedProfileMenuOpen(false);
              setExpandedProfileMenuOpen((prev) => !prev);
            }
          }}
          title={collapsed ? userName : undefined}
          className={`mb-2 flex w-full items-center rounded-xl text-left transition hover:bg-[#6F4E37]/20 ${
            collapsed ? "justify-center p-2" : "gap-3 p-3"
          }`}
        >

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B45A2A] text-sm font-serif text-white">
            {userInitials}
          </div>


          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-sm font-semibold text-slate-700">
                {userName}
              </p>

              <p className="truncate font-serif text-xs text-slate-500">
                {userRole}
              </p>
            </div>
          )}
        </button>


        {!collapsed && expandedProfileMenuOpen && (
          <div className="absolute bottom-full left-4 z-[100] mb-2 w-[253px] overflow-hidden rounded-[20px] bg-[#363636] text-white shadow-2xl">
            <div className="px-4 pt-4">
              <div className="flex items-center gap-3 rounded-xl p-1">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#B45A2A] text-xs font-medium text-white">
                  {userInitials}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {userName}
                  </p>

                  <p className="truncate text-sm text-gray-400">{userRole}</p>
                </div>
              </div>
            </div>

            <div className="mx-4 my-4 border-t border-white/15" />

            <div className="px-2">

              <Link
                href="/student/profile"
                onClick={() => setExpandedProfileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-gray-100 transition hover:bg-white/10"
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <circle cx="12" cy="8" r="3.5" />

                  <path
                    strokeLinecap="round"
                    d="M5 20c.7-3.3 3.2-5.5 7-5.5s6.3 2.2 7 5.5"
                  />
                </svg>

                <span>Profile</span>
              </Link>


              <Link
                href="/student/settings"
                onClick={() => setExpandedProfileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-gray-100 transition hover:bg-white/10"
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>

                <span>Settings</span>
              </Link>
            </div>

            <div className="mx-4 my-4 border-t border-white/15" />


            <div className="px-2 pb-2">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm text-gray-100 transition hover:bg-white/10"
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6"
                  />
                </svg>

                <span>Log out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
