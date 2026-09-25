"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import TeacherSidebar from "@/components/teachers/TeacherSidebar";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== "TEACHER")) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#EAE6DC]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#B45A2B]/20 border-t-[#B45A2B]" />
          <p className="mt-4 font-serif text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "TEACHER") {
    return null;
  }

  return (
    <div className="flex h-screen min-h-0 overflow-hidden font-inter">
      <TeacherSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
