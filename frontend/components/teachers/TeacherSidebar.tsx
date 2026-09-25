"use client";

import { useAuth } from "@/lib/auth-context";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { apiFetch } from "@/lib/api";

const SIDEBAR_STORAGE_KEY = "teacher-sidebar-collapsed";

type TeacherProfileResponse = {
  success: boolean;
  data: {
    id: number;
    name: string;
    username: string;
    email: string;
    status: string;
    createdAt: string;
    teacherProfile: {
      id: number;
      department: string;
      qualification: string;
      experience: number;
    } | null;
  };
};

function getSidebarSnapshot(): boolean {
  try {
    const value = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return value === null ? true : value === "true";
  } catch {
    return true;
  }
}

function subscribeSidebar(callback: () => void): () => void {
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener("storage", callback);
  };
}

const navItems = [
  {
    name: "Dashboard",
    href: "/teacher/dashboard",
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
    href: "/teacher/courses",
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
    href: "/teacher/assignments",
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
    name: "Students",
    href: "/teacher/students",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="9" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />

        <path
          strokeLinecap="round"
          d="M3.5 19c.7-3.1 2.7-5 5.5-5s4.8 1.9 5.5 5M14 15c2.5-.2 4.8 1.2 5.5 4"
        />
      </svg>
    ),
  },
  {
    name: "Attendance",
    href: "/teacher/attendance",
    icon: (
      <svg
        className="h-5 w-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path strokeLinecap="round" d="M8 3v4M16 3v4M3 10h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m8 15 2 2 5-5" />
      </svg>
    ),
  },
  {
    name: "Grades",
    href: "/teacher/grades",
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
];

const ProfileIcon = () => (
  <svg
    className="h-5 w-5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <circle cx="12" cy="8" r="3.5" />

    <path strokeLinecap="round" d="M5 20c.7-3.3 3.2-5.5 7-5.5s6.3 2.2 7 5.5" />
  </svg>
);

const LogoutIcon = () => (
  <svg
    className="h-5 w-5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 17l5-5-5-5M15 12H3M21 19V5a2 2 0 0 0-2-2h-6"
    />
  </svg>
);

const SettingsIcon = () => (
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
      d="M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.37-.31-.6-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98L14.5 2.42C14.47 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.5.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.08-.48 0-.6.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.08.65-.08.98s.03.66.08.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.37.31.6.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.23.08.48 0 .6-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65Z"
    />

    <circle cx="12" cy="12" r="3.5" />
  </svg>
);

export default function TeacherSidebar() {
  const { logout, user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [teacherName, setTeacherName] = useState("Teacher");

  const [teacherDepartment, setTeacherDepartment] = useState("Teacher");

  const [loadingProfile, setLoadingProfile] = useState(true);

  const collapsed = useSyncExternalStore(
    subscribeSidebar,
    getSidebarSnapshot,
    () => true,
  );

  const updateCollapsed = useCallback((value: boolean) => {
    setProfileMenuOpen(false);

    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(value));

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: SIDEBAR_STORAGE_KEY,
        newValue: String(value),
      }),
    );
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadTeacherProfile() {
      try {
        const token = localStorage.getItem("scm_token");

        if (!token) {
          router.push("/login");
          return;
        }

        const response = await apiFetch<TeacherProfileResponse>(
          "/teachers/me",
          {
            token,
          },
        );

        if (!mounted) return;

        const user = response.data;

        const teacherProfile = response.data?.teacherProfile;

        if (user?.name) {
          setTeacherName(user.name);
        }

        if (teacherProfile?.department) {
          setTeacherDepartment(teacherProfile.department);
        } else {
          setTeacherDepartment("Teacher");
        }
      } catch (error) {
        console.error("Failed to load teacher sidebar profile:", error);
      } finally {
        if (mounted) {
          setLoadingProfile(false);
        }
      }
    }

    void loadTeacherProfile();

    return () => {
      mounted = false;
    };
  }, [router]);

  const displayedTeacherName = user?.name || teacherName;
  const initials =
    displayedTeacherName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "T";

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

            <div className="absolute inset-0 flex h-8 w-8 items-center justify-center rounded-xl bg-[#B45A2A] text-white shadow-lg shadow-[#45413D]/10 transition-all duration-200 group-hover:opacity-0">
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
              className="absolute inset-0 flex h-8 w-8 items-center justify-center rounded-xl bg-[#B45A2A] text-white opacity-0 transition-all duration-200 group-hover:opacity-100"
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
              <p className="whitespace-nowrap font-serif text-lg tracking-tight text-[#333333]">
                SC
                <span className="text-[#B45A2A]">M</span>
              </p>
            </div>


            <button
              type="button"
              onClick={() => updateCollapsed(true)}
              aria-label="Collapse sidebar"
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#333333] transition hover:bg-[#B45A2A]/90 hover:text-white"
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

        {profileMenuOpen && (
          <div
            className={`absolute bottom-full z-[100] mb-2 w-[253px] overflow-hidden rounded-[20px] bg-[#363636] text-white shadow-2xl ${
              collapsed ? "left-2" : "left-4"
            }`}
          >

            <div className="px-4 pt-4">
              <div className="flex items-center gap-3 rounded-xl p-1">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B45A2A] text-sm font-medium text-white">
                  {initials}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {loadingProfile ? "Loading..." : displayedTeacherName}
                  </p>

                  <p className="truncate text-sm text-gray-400">
                    {teacherDepartment}
                  </p>
                </div>
              </div>
            </div>

            <div className="mx-4 my-4 border-t border-white/15" />


            <div className="px-2">
              <Link
                href="/teacher/profile"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-gray-100 transition hover:bg-white/10"
              >
                <ProfileIcon />

                <span>Profile</span>
              </Link>

              <Link
                href="/teacher/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-3 rounded-lg px-2 py-2.5 text-sm text-gray-100 transition hover:bg-white/10"
              >
                <SettingsIcon />

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
                <LogoutIcon />

                <span>Log out</span>
              </button>
            </div>
          </div>
        )}


        <button
          type="button"
          onClick={() => setProfileMenuOpen((open) => !open)}
          title={collapsed ? displayedTeacherName : undefined}
          className={`mb-2 flex w-full items-center rounded-xl text-left transition hover:bg-[#6F4E37]/20 ${
            collapsed ? "justify-center p-2" : "gap-3 p-3"
          }`}
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#B45A2A] font-serif text-sm text-white">
            {initials}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate font-serif text-sm font-semibold text-slate-700">
                {loadingProfile ? "Loading..." : displayedTeacherName}
              </p>

              <p className="truncate font-serif text-xs text-slate-500">
                {teacherDepartment}
              </p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
