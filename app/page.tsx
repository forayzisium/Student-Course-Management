import Link from "next/link";
import { ArrowRight, BookOpen, Clock, GraduationCap } from "lucide-react";

const highlights = [
  {
    title: "Course overview",
    description: "See your active courses, progress levels, and upcoming classes in one place.",
    icon: BookOpen,
  },
  {
    title: "Assignments at a glance",
    description: "Track deadlines, submission status, and important academic reminders.",
    icon: Clock,
  },
  {
    title: "Student success",
    description: "Stay informed with announcements, milestones, and performance insights.",
    icon: GraduationCap,
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 px-6 py-16 text-zinc-900 dark:bg-black dark:text-zinc-50 sm:px-8 lg:px-12">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center rounded-3xl border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur sm:p-10 lg:p-16 dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="max-w-2xl">
          <p className="mb-4 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-200">
            Student Course Management
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Keep your academic life organized in one dashboard.
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-300">
            Monitor courses, assignments, and announcements with a clean student-focused experience that helps you stay on top of every deadline.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/student/dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Open dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {highlights.map(({ title, description, icon: Icon }) => (
            <div
              key={title}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/80"
            >
              <div className="mb-4 inline-flex rounded-xl bg-zinc-900 p-2 text-white dark:bg-white dark:text-zinc-950">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
