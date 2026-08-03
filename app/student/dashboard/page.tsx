'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  GraduationCap,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Search,
  Filter,
  Bell,
  ChevronRight,
  Sparkles,
  Award,
  TrendingUp,
  Download,
  Grid,
  List,
  X,
  MapPin,
  ArrowUpRight,
  Check,
  MessageSquare,
  BookMarked,
  SlidersHorizontal,
  FolderOpen
} from 'lucide-react';

// Data Types
interface Course {
  id: string;
  code: string;
  title: string;
  category: 'Core' | 'Elective' | 'Lab';
  instructor: string;
  instructorTitle: string;
  schedule: string;
  room: string;
  progress: number;
  grade: string;
  percentageGrade: number;
  totalModules: number;
  completedModules: number;
  accentColor: string;
  nextClass: string;
  upcomingTask: string;
  description: string;
}

interface Assignment {
  id: string;
  courseCode: string;
  courseTitle: string;
  title: string;
  dueDate: string;
  dueRelative: string;
  status: 'pending' | 'submitted' | 'graded';
  points: string;
  type: 'Quiz' | 'Project' | 'Lab Report' | 'Homework';
}

interface Announcement {
  id: string;
  title: string;
  courseCode: string;
  author: string;
  date: string;
  priority: 'high' | 'normal';
  snippet: string;
}

interface StudentProfile {
  name: string;
  studentId: string;
  program: string;
  department: string;
  semester: string;
  gpa: number;
  totalCredits: number;
  completedCredits: number;
  attendanceRate: number;
  avatarUrl?: string;
}

// Mock Initial Data
const mockStudent: StudentProfile = {
  name: 'Alex Morgan',
  studentId: 'CS-2024-8942',
  program: 'B.Sc. in Computer Science & Engineering',
  department: 'Department of Computer Science',
  semester: '6th Semester (Fall 2026)',
  gpa: 3.88,
  completedCredits: 96,
  totalCredits: 136,
  attendanceRate: 95.4,
};

const mockCourses: Course[] = [
  {
    id: 'c1',
    code: 'CSE 301',
    title: 'Software Architecture & Design Patterns',
    category: 'Core',
    instructor: 'Dr. Sarah Jenkins',
    instructorTitle: 'Professor of Software Engineering',
    schedule: 'Mon & Wed, 10:00 AM - 11:30 AM',
    room: 'Lab 402 • Academic Block B',
    progress: 78,
    grade: 'A',
    percentageGrade: 92,
    totalModules: 12,
    completedModules: 9,
    accentColor: 'from-blue-600 to-indigo-600',
    nextClass: 'Tomorrow, 10:00 AM',
    upcomingTask: 'Design Pattern Refactoring Assignment due in 2 days',
    description: 'Advanced software design principles including SOLID design, MVC, Microservices, and GoF patterns architecture.'
  },
  {
    id: 'c2',
    code: 'CSE 305',
    title: 'Database Management Systems',
    category: 'Core',
    instructor: 'Prof. Robert Miller',
    instructorTitle: 'Associate Professor',
    schedule: 'Tue & Thu, 01:30 PM - 03:00 PM',
    room: 'Room 305 • Science Building',
    progress: 85,
    grade: 'A-',
    percentageGrade: 89,
    totalModules: 10,
    completedModules: 8,
    accentColor: 'from-emerald-600 to-teal-600',
    nextClass: 'Thursday, 01:30 PM',
    upcomingTask: 'SQL Index Optimization Quiz on Friday',
    description: 'Relational algebra, SQL query optimization, indexing strategies, transaction handling, and NoSQL databases.'
  },
  {
    id: 'c3',
    code: 'CSE 309',
    title: 'Artificial Intelligence & Neural Networks',
    category: 'Elective',
    instructor: 'Dr. Elena Rostova',
    instructorTitle: 'Head of AI Research Lab',
    schedule: 'Mon & Wed, 02:00 PM - 03:30 PM',
    room: 'Auditorium 2 • Tech Center',
    progress: 62,
    grade: 'A',
    percentageGrade: 94,
    totalModules: 14,
    completedModules: 8,
    accentColor: 'from-purple-600 to-pink-600',
    nextClass: 'Wednesday, 02:00 PM',
    upcomingTask: 'CNN Image Classifier Project due next week',
    description: 'Foundations of machine learning, backpropagation algorithms, convolutional networks, and natural language processing.'
  },
  {
    id: 'c4',
    code: 'CSE 312L',
    title: 'Web Engineering Laboratory',
    category: 'Lab',
    instructor: 'Engr. Michael Zhang',
    instructorTitle: 'Senior Lab Lecturer',
    schedule: 'Friday, 09:00 AM - 12:00 PM',
    room: 'Software Lab 3 • Annex Building',
    progress: 90,
    grade: 'A+',
    percentageGrade: 97,
    totalModules: 8,
    completedModules: 7,
    accentColor: 'from-amber-500 to-orange-600',
    nextClass: 'Friday, 09:00 AM',
    upcomingTask: 'Next.js App Router Integration Lab Report',
    description: 'Hands-on practical laboratory building modern full-stack web applications with React, Next.js, and API endpoints.'
  },
  {
    id: 'c5',
    code: 'MATH 302',
    title: 'Numerical Methods & Optimization',
    category: 'Core',
    instructor: 'Dr. Alan Vance',
    instructorTitle: 'Professor of Mathematics',
    schedule: 'Tue & Thu, 10:00 AM - 11:30 AM',
    room: 'Hall B • Main Campus',
    progress: 70,
    grade: 'B+',
    percentageGrade: 86,
    totalModules: 11,
    completedModules: 7,
    accentColor: 'from-cyan-600 to-blue-700',
    nextClass: 'Thursday, 10:00 AM',
    upcomingTask: 'Matrix Eigenvalues Problem Set',
    description: 'Root finding algorithms, interpolation techniques, numerical integration, and linear programming.'
  }
];

const mockAssignments: Assignment[] = [
  {
    id: 'a1',
    courseCode: 'CSE 301',
    courseTitle: 'Software Architecture',
    title: 'Design Pattern Refactoring (Strategy & Factory)',
    dueDate: 'Aug 06, 2026',
    dueRelative: 'In 2 days',
    status: 'pending',
    points: '50 pts',
    type: 'Project'
  },
  {
    id: 'a2',
    courseCode: 'CSE 305',
    courseTitle: 'Database Systems',
    title: 'B-Tree Index Performance Benchmark',
    dueDate: 'Aug 08, 2026',
    dueRelative: 'In 4 days',
    status: 'pending',
    points: '30 pts',
    type: 'Lab Report'
  },
  {
    id: 'a3',
    courseCode: 'CSE 309',
    courseTitle: 'Artificial Intelligence',
    title: 'MNIST Digit Classification with PyTorch',
    dueDate: 'Aug 12, 2026',
    dueRelative: 'In 8 days',
    status: 'pending',
    points: '100 pts',
    type: 'Project'
  },
  {
    id: 'a4',
    courseCode: 'CSE 312L',
    courseTitle: 'Web Engineering',
    title: 'RESTful API & Auth Middleware Submission',
    dueDate: 'Aug 01, 2026',
    dueRelative: 'Completed',
    status: 'graded',
    points: '48/50 pts',
    type: 'Homework'
  }
];

const mockAnnouncements: Announcement[] = [
  {
    id: 'ann1',
    title: 'Midterm Examination Schedule Released',
    courseCode: 'Department Notice',
    author: 'Academic Office',
    date: 'Aug 03, 2026',
    priority: 'high',
    snippet: 'The midterm examinations for Fall 2026 semester will commence from August 20. Please check your hall tickets.'
  },
  {
    id: 'ann2',
    title: 'Guest Lecture on Cloud Microservices Architecture',
    courseCode: 'CSE 301',
    author: 'Dr. Sarah Jenkins',
    date: 'Aug 02, 2026',
    priority: 'normal',
    snippet: 'Join us this Thursday at 3 PM in Auditorium 1 for a special industry talk by Principal Cloud Architect at Google.'
  },
  {
    id: 'ann3',
    title: 'Lab 3 Extension Approved',
    courseCode: 'CSE 312L',
    author: 'Engr. Michael Zhang',
    date: 'Jul 30, 2026',
    priority: 'normal',
    snippet: 'Due to network maintenance, the deadline for Lab 3 report has been extended by 48 hours.'
  }
];

export default function StudentDashboardPage() {
  const [student] = useState<StudentProfile>(mockStudent);
  const [courses] = useState<Course[]>(mockCourses);
  const [assignments, setAssignments] = useState<Assignment[]>(mockAssignments);
  const [announcements] = useState<Announcement[]>(mockAnnouncements);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState<'courses' | 'assignments' | 'announcements'>('courses');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [notificationCount, setNotificationCount] = useState(3);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Computed metrics
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        selectedCategory === 'All' || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [courses, searchQuery, selectedCategory]);

  const pendingAssignmentsCount = useMemo(() => {
    return assignments.filter((a) => a.status === 'pending').length;
  }, [assignments]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleMarkAssignmentDone = (id: string) => {
    setAssignments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'submitted' as const } : a))
    );
    triggerToast('Assignment marked as submitted!');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-3 rounded-xl shadow-2xl border border-zinc-700 dark:border-zinc-300 animate-in fade-in slide-in-from-top-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header / Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand / Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg leading-tight tracking-tight text-zinc-900 dark:text-white block">
                EduPortal
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium block">
                Student Portal • SCM
              </span>
            </div>
          </div>

          {/* Center Search Input (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search enrolled courses, codes, or instructors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-800/80 text-sm text-zinc-900 dark:text-zinc-100 pl-10 pr-4 py-2 rounded-xl border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-900 focus:outline-none transition-all placeholder:text-zinc-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      Recent Notifications
                    </h4>
                    <button
                      onClick={() => setNotificationCount(0)}
                      className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto">
                    {announcements.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors text-xs space-y-1 border border-zinc-100 dark:border-zinc-800/50"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                            {item.courseCode}
                          </span>
                          <span className="text-zinc-400">{item.date}</span>
                        </div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                          {item.title}
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400 line-clamp-2">
                          {item.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Pill */}
            <div className="flex items-center gap-3 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm ring-2 ring-indigo-500/20">
                AM
              </div>
              <div className="hidden sm:block text-left">
                <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 block leading-tight">
                  {student.name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 block">
                  {student.studentId}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-indigo-950/10">
          {/* Decorative background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 -mb-16 w-60 h-60 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-medium text-indigo-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{student.semester}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                Welcome back, {student.name}! 👋
              </h1>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                {student.program} • {student.department}
              </p>
            </div>

            {/* Quick Action Header Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => triggerToast('Official Semester Transcript PDF downloaded!')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium border border-white/15 backdrop-blur-md transition-all active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Transcript</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('assignments');
                  triggerToast('Navigated to Pending Assignments!');
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Calendar className="w-4 h-4" />
                <span>Upcoming Tasks ({pendingAssignmentsCount})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Enrolled Courses */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Enrolled Courses
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {courses.length}
                </span>
                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                15 Credit Hours this term
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Cumulative GPA */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Cumulative GPA
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {student.gpa.toFixed(2)}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Top 5%
                </span>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Out of 4.00 Scale
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Pending Tasks */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Pending Tasks
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {pendingAssignmentsCount}
                </span>
                <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
                  Due Soon
                </span>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Next due in 2 days
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Attendance & Credits */}
          <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
            <div className="space-y-1">
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                Overall Attendance
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                  {student.attendanceRate}%
                </span>
                <span className="text-xs font-medium text-teal-600 dark:text-teal-400">
                  {student.completedCredits}/{student.totalCredits} Cr
                </span>
              </div>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Excellent record
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Tab Navigation & Search Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
          {/* Main Content Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'courses'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Enrolled Courses ({filteredCourses.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'assignments'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Assignments & Tasks ({assignments.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === 'announcements'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Announcements ({announcements.length})</span>
            </button>
          </div>

          {/* Filters & Display Toggles (When in Courses Tab) */}
          {activeTab === 'courses' && (
            <div className="flex items-center gap-3">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 text-xs">
                {['All', 'Core', 'Elective', 'Lab'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      selectedCategory === cat
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                      : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Enrolled Courses Section */}
        {activeTab === 'courses' && (
          <section className="space-y-6">
            {filteredCourses.length === 0 ? (
              <div className="bg-white dark:bg-zinc-900 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-3xl p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto">
                  <FolderOpen className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-zinc-800 dark:text-zinc-200">
                  No courses found matching your criteria
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Try clearing your search query or switching the category filter.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              /* Grid Layout */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Top Accent Gradient Header */}
                    <div className={`h-3 bg-gradient-to-r ${course.accentColor}`} />

                    <div className="p-6 space-y-5 flex-1 flex flex-col justify-between">
                      {/* Course Header */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold tracking-wider px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                            {course.code}
                          </span>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                              course.category === 'Core'
                                ? 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300'
                                : course.category === 'Elective'
                                ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300'
                                : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'
                            }`}
                          >
                            {course.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{course.instructor}</span>
                        </p>
                      </div>

                      {/* Schedule & Location */}
                      <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300 border border-zinc-100 dark:border-zinc-800/50">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="font-medium">{course.schedule}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span>{course.room}</span>
                        </div>
                      </div>

                      {/* Course Progress */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-zinc-500 dark:text-zinc-400">
                            Course Progress ({course.completedModules}/{course.totalModules} Modules)
                          </span>
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {course.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${course.accentColor} transition-all duration-500`}
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                        <div className="text-xs">
                          <span className="text-zinc-400 block">Current Grade</span>
                          <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                            {course.grade} ({course.percentageGrade}%)
                          </span>
                        </div>
                        <button
                          onClick={() => setSelectedCourse(course)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-indigo-600 dark:hover:bg-indigo-400 transition-colors"
                        >
                          <span>Course Details</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List Layout */
              <div className="space-y-3">
                {filteredCourses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center shrink-0 text-sm">
                        {course.code.split(' ')[0]}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {course.code}
                          </span>
                          <h4 className="font-bold text-base text-zinc-900 dark:text-white">
                            {course.title}
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Instructor: {course.instructor} • {course.schedule}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-zinc-100 dark:border-zinc-800">
                      <div className="text-right space-y-1 min-w-[120px]">
                        <div className="text-xs text-zinc-400">Progress: {course.progress}%</div>
                        <div className="w-28 bg-zinc-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full bg-gradient-to-r ${course.accentColor}`}
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-center">
                        <span className="text-xs text-zinc-400 block">Grade</span>
                        <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                          {course.grade}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedCourse(course)}
                        className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold hover:bg-indigo-600 transition-colors"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Assignments & Tasks */}
        {activeTab === 'assignments' && (
          <section className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden shadow-sm">
              <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                    Course Assignments & Submissions
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Track deadlines and submit coursework
                  </p>
                </div>
              </div>

              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {assignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                          assignment.status === 'pending'
                            ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {assignment.status === 'pending' ? (
                          <Clock className="w-5 h-5" />
                        ) : (
                          <CheckCircle2 className="w-5 h-5" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                            {assignment.courseCode}
                          </span>
                          <span className="text-xs text-zinc-400">• {assignment.type}</span>
                        </div>
                        <h4 className="font-semibold text-zinc-900 dark:text-white text-base">
                          {assignment.title}
                        </h4>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-3">
                          <span>Due: {assignment.dueDate}</span>
                          <span>•</span>
                          <span
                            className={
                              assignment.status === 'pending'
                                ? 'font-medium text-rose-600 dark:text-rose-400'
                                : 'text-emerald-600 dark:text-emerald-400 font-medium'
                            }
                          >
                            {assignment.dueRelative}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-100 dark:border-zinc-800">
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                        {assignment.points}
                      </span>
                      {assignment.status === 'pending' ? (
                        <button
                          onClick={() => handleMarkAssignmentDone(assignment.id)}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-sm"
                        >
                          Submit Work
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl">
                          <Check className="w-3.5 h-3.5" />
                          <span>Submitted</span>
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Tab 3: Announcements */}
        {activeTab === 'announcements' && (
          <section className="space-y-4">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-lg text-zinc-900 dark:text-white">
                Course Notices & Department Updates
              </h3>
              <div className="space-y-4">
                {announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {ann.courseCode}
                        </span>
                        {ann.priority === 'high' && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Urgent
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-zinc-400">{ann.date}</span>
                    </div>
                    <h4 className="font-bold text-zinc-900 dark:text-white text-base">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                      {ann.snippet}
                    </p>
                    <div className="pt-2 text-xs text-zinc-400 flex items-center justify-between">
                      <span>Posted by {ann.author}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedCourse(null)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="space-y-2 pr-8">
              <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {selectedCourse.code} • {selectedCourse.category}
              </span>
              <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-white leading-tight">
                {selectedCourse.title}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Instructed by <span className="font-semibold text-zinc-800 dark:text-zinc-200">{selectedCourse.instructor}</span> ({selectedCourse.instructorTitle})
              </p>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Course Synopsis
              </h4>
              <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                {selectedCourse.description}
              </p>
            </div>

            {/* Key Information */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 text-xs">
              <div>
                <span className="text-zinc-400 block">Class Schedule</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedCourse.schedule}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">Classroom</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedCourse.room}
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">Modules Completed</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {selectedCourse.completedModules} of {selectedCourse.totalModules} Modules
                </span>
              </div>
              <div>
                <span className="text-zinc-400 block">Current Standing</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {selectedCourse.grade} ({selectedCourse.percentageGrade}%)
                </span>
              </div>
            </div>

            {/* Upcoming Task Alert */}
            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1 text-xs">
              <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> Next Upcoming Task
              </span>
              <p className="text-indigo-700 dark:text-indigo-300">
                {selectedCourse.upcomingTask}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  triggerToast(`Downloading Syllabus for ${selectedCourse.code}...`);
                }}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Syllabus PDF</span>
              </button>
              <button
                onClick={() => setSelectedCourse(null)}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-200 dark:border-zinc-800 py-6 bg-white dark:bg-zinc-900 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 Student Course Management System (SCM). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
