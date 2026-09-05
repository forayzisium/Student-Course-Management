'use client';

import StatCard from "@/components/students/StatCard";
import CourseCard from "@/components/students/CourseCard";
import AssignmentCard from "@/components/students/AssignmentCard";

export default function StudentDashboard() {
    return (
        <div className="flex min-h-screen bg-[#EAE6DC]">

            {/* Main Content */}
            <main className="min-w-0 flex-1 p-5 sm:p-8">

                {/* Header */}
                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <p className="text-sm text-[#B45A2A] font-serif">
                            Student Dashboard
                        </p>

                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#333333] font-serif sm:text-3xl">
                            Good morning, Sium 👋
                        </h1>

                        <p className="mt-2 text-sm text-slate-500 font-serif">
                            Here&apos;s an overview of your academic activity.
                        </p>
                    </div>

                    {/* Date */}
                    <div className="flex w-fit items-center gap-2 rounded-xl border bg-slate-900 text-white shadow-md px-4 py-3 shadow-sm">
                        <svg
                            className="h-5 w-5 text-white"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <rect
                                x="3"
                                y="4"
                                width="18"
                                height="17"
                                rx="2"
                            />

                            <path
                                strokeLinecap="round"
                                d="M16 2v4M8 2v4M3 10h18"
                            />
                        </svg>

                        <span className="text-sm font-medium text-white font-serif">
                            Spring 2026
                        </span>
                    </div>
                </div>

                {/* Statistics */}
                <section>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                        <StatCard
                            title="Enrolled Courses"
                            value="06"
                            description="Active courses"
                            icon={
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
                            }
                        />

                        <StatCard
                            title="Completed"
                            value="03"
                            description="Courses completed"
                            icon={
                                <svg
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <circle cx="12" cy="12" r="9" />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m8 12 2.5 2.5L16 9"
                                    />
                                </svg>
                            }
                        />

                        <StatCard
                            title="Assignments"
                            value="04"
                            description="Pending assignments"
                            icon={
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
                                        d="M9 5h6M9 3h6a1 1 0 0 1 1 1v1h1a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1V4a1 1 0 0 1 1-1Z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="m9 13 2 2 4-4"
                                    />
                                </svg>
                            }
                        />

                        <StatCard
                            title="Current GPA"
                            value="3.72"
                            description="This semester"
                            icon={
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
                                        d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M8 17v-4M12 17V9M16 17v-7"
                                    />
                                </svg>
                            }
                        />

                    </div>
                </section>

                {/* Courses + Assignments */}
                <div className="mt-10 grid gap-8 xl:grid-cols-[1.6fr_1fr]">

                    {/* My Courses */}
                    <section>

                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    My Courses
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Continue learning where you left off.
                                </p>
                            </div>

                            <a
                                href="/student/courses"
                                className="text-sm font-semibold text-dark transition hover:text-[#B45A2A]"
                            >
                                View all →
                            </a>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">

                            <CourseCard
                                code="CSE 326"
                                title="Web Development"
                                instructor="Dr. Rahman"
                                progress={72}
                            />

                            <CourseCard
                                code="CSE 324"
                                title="Database Management"
                                instructor="Dr. Ahmed"
                                progress={58}
                            />

                            <CourseCard
                                code="CSE 328"
                                title="Software Engineering"
                                instructor="Dr. Karim"
                                progress={45}
                            />

                            <CourseCard
                                code="CSE 330"
                                title="Computer Networks"
                                instructor="Dr. Hasan"
                                progress={81}
                            />

                        </div>
                    </section>

                    {/* Assignments */}
                    <section>

                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    Upcoming
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Your upcoming assignments.
                                </p>
                            </div>

                            <a
                                href="/student/assignments"
                                className="text-sm font-semibold text-dark transition hover:text-[#B45A2A]"
                            >
                                View all →
                            </a>
                        </div>

                        <div className="grid gap-5 md:grid-cols-2">

                            <AssignmentCard
                                course="Database Management"
                                title="ER Diagram Assignment"
                                dueDate="Tomorrow"
                                status="Pending"
                            />

                            <AssignmentCard
                                course="Web Development"
                                title="React Project"
                                dueDate="Aug 20"
                                status="Pending"
                            />

                            <AssignmentCard
                                course="Software Engineering"
                                title="SRS Documentation"
                                dueDate="Aug 23"
                                status="Submitted"
                            />

                        </div>

                    </section>

                </div>

            </main>
        </div>
    );
}