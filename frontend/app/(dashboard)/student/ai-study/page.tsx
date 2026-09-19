"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { apiFetch } from "@/lib/api";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type AIResponse = {
  success: boolean;
  data: {
    reply: string;
    plan: string;
    used: number;
    limit: number;
    remaining: number;
  };
};

type AIUsageResponse = {
  success: boolean;
  data: {
    allowed: boolean;
    plan: string;
    used: number;
    limit: number;
    remaining: number;
  };
};

type AISubject = {
  code: string;
  name: string;
  academicProgress: number;
  attendancePercentage: number | null;
  grade: string;
  status: string;
};

type AISuggestion = {
  title: string;
  description: string;
  priority: string;
  type: string;
};

type AIOverviewResponse = {
  success: boolean;
  data: {
    subjects: AISubject[];
    suggestions: AISuggestion[];
  };
};

export default function AIStudyPage() {
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");

  const [question, setQuestion] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [loading, setLoading] = useState(false);

  const [remainingMessages, setRemainingMessages] = useState<number | null>(
    null,
  );

  const [usageLimit, setUsageLimit] = useState<number | null>(null);

  const [plannerDuration, setPlannerDuration] = useState("This Week");

  const [plannerHours, setPlannerHours] = useState("2");

  const [subjects, setSubjects] = useState<AISubject[]>([]);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const token = localStorage.getItem("scm_token");

        if (!token) {
          return;
        }

        const response = await apiFetch<AIUsageResponse>("/ai/usage", {
          token,
        });

        if (response.success && response.data) {
          setRemainingMessages(response.data.remaining);
          setUsageLimit(response.data.limit);
        }
      } catch (error) {
        console.error("Failed to load AI usage:", error);
      }
    };

    fetchUsage();
  }, []);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        setOverviewLoading(true);
        setOverviewError("");

        const token = localStorage.getItem("scm_token");

        if (!token) {
          return;
        }

        const response = await apiFetch<AIOverviewResponse>("/ai/overview", {
          token,
        });

        if (response.success && response.data) {
          setSubjects(response.data.subjects || []);
          setSuggestions(response.data.suggestions || []);
        }
      } catch (error) {
        console.error("Failed to load AI overview:", error);
        setOverviewError(
          error instanceof Error ? error.message : "Failed to load overview",
        );
      } finally {
        setOverviewLoading(false);
      }
    };

    void fetchOverview();
    const refresh = () => {
      void fetchOverview();
    };
    window.addEventListener("scm:student-refresh", refresh);
    return () => window.removeEventListener("scm:student-refresh", refresh);
  }, []);

  const filteredSubjects =
    selectedSubject === "All Subjects"
      ? subjects
      : subjects.filter((subject) => subject.name === selectedSubject);

  const sendAIMessage = async (message: string) => {
    const trimmedMessage = message.trim();

    if (
      !trimmedMessage ||
      loading ||
      remainingMessages === null ||
      remainingMessages <= 0
    ) {
      return;
    }

    const userMessage: ChatMessage = {
      role: "user",
      content: trimmedMessage,
    };

    setMessages((prev) => [...prev, userMessage]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await apiFetch<AIResponse>("/ai/chat", {
        method: "POST",
        token: localStorage.getItem("scm_token") || "",
        body: JSON.stringify({
          message: trimmedMessage,
          history: messages,
        }),
      });

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: response.data.reply,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      setRemainingMessages(response.data.remaining);

      setUsageLimit(response.data.limit);
    } catch (error) {
      const baseMessage =
        error instanceof Error ? error.message : "Failed to get AI response.";

      const details =
        error instanceof Error && "details" in error
          ? error.details
          : undefined;
      const backendError =
        details &&
        typeof details === "object" &&
        "error" in details &&
        typeof details.error === "string"
          ? details.error
          : undefined;

      const errorMessage = backendError || baseMessage;

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, ${errorMessage}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = async () => {
    await sendAIMessage(question);
  };

  const handleGenerateStudyPlan = async () => {
    const hours = Number(plannerHours);

    const prompt = `
Create a personalized ${plannerDuration.toLowerCase()} study plan for me.

I can study approximately ${hours} ${hours === 1 ? "hour" : "hours"} per day.

Use my actual SCM academic context, including:

- GPA and overall average
- Weakest and strongest subjects
- Attendance warnings
- Pending assignments
- Upcoming assignment deadlines
- Current courses
- Academic priorities

Make the plan realistic and organized by day.

For each day, include:

- Course/subject
- Specific study activity
- Approximate time
- Priority
- A short reason when useful

Do not invent specific course topics that are not available
in my academic context.

If a topic is unknown, use activities such as:

- Reviewing notes
- Practicing problems
- Revising recent lessons
- Preparing for upcoming assignments
- Reviewing previous class materials

Do not overload the student with an unreasonable number
of tasks.

End with a short "Priority Summary" containing the
3 most important things I should focus on.
        `.trim();

    await sendAIMessage(prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskAI();
    }
  };

  return (
    <div className="flex min-h-screen bg-[#EAE6DC]">
      <main className="min-w-0 flex-1 p-5 sm:p-8">
        <div className="mb-8">
          <p className="font-serif text-sm text-[#B45A2A]">Student Portal</p>

          <h1 className="mt-1 font-serif text-3xl font-bold text-[#333333]">
            AI Study Assistant
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Get personalized study guidance and ask questions about your
            courses, assignments and exams.
          </p>
        </div>

        <section className="overflow-hidden rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black text-white">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"
                    />

                    <circle cx="12" cy="12" r="4" />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    AI Study Assistant
                  </p>

                  <p className="text-xs text-slate-400">
                    Personalized academic guidance
                  </p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Study smarter, not harder.
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                Ask questions about your studies and get instant guidance from
                your AI study assistant.
              </p>
            </div>

            <div className="rounded-2xl bg-[#F0EDE4] px-6 py-5">
              <p className="text-xs font-medium text-slate-500">AI Messages</p>

              <p className="mt-1 text-2xl font-bold text-[#B45A2A]">
                {remainingMessages === null ? "..." : remainingMessages}

                <span className="text-sm font-medium text-slate-400">
                  {" "}
                  / {usageLimit === null ? "..." : usageLimit}
                </span>
              </p>

              <p className="mt-1 text-xs text-slate-400">remaining today</p>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900">
                  Your Recommendations
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Suggestions based on your current academic performance.
                </p>
              </div>

              <span className="shrink-0 whitespace-nowrap rounded-full bg-[#B45A2A]/10 px-3 py-1.5 text-xs font-semibold text-[#B45A2A]">
                {suggestions.length} Suggestions
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {overviewLoading ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  Loading recommendations...
                </div>
              ) : overviewError ? (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                  {overviewError}
                </div>
              ) : suggestions.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  No recommendations available yet.
                </div>
              ) : (
                suggestions.map((suggestion, index) => {
                  return (
                    <div
                      key={suggestion.title}
                      className="rounded-xl border border-slate-100 p-4 transition hover:border-[#B45A2A]/30 hover:shadow-sm sm:p-5"
                    >
                      <div className="flex gap-3 sm:gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0EDE4] font-semibold text-[#B45A2A]">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                            <h3 className="break-words font-semibold text-slate-800">
                              {suggestion.title}
                            </h3>

                            <span
                              className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                suggestion.priority === "High Priority"
                                  ? "bg-red-50 text-red-600"
                                  : suggestion.priority === "Medium Priority"
                                    ? "bg-amber-50 text-amber-600"
                                    : "bg-green-50 text-green-600"
                              }`}
                            >
                              {suggestion.priority}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-500">
                            {suggestion.description}
                          </p>

                          <span className="mt-3 inline-block text-xs font-medium text-slate-400">
                            {suggestion.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B45A2A]/10 text-lg">
                📅
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  AI Study Planner
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Generate a personalized study plan using your real academic
                  performance, deadlines, and priorities.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Plan Duration
                </label>

                <select
                  value={plannerDuration}
                  onChange={(e) => setPlannerDuration(e.target.value)}
                  disabled={
                    loading ||
                    remainingMessages === null ||
                    remainingMessages <= 0
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#B45A2A] disabled:bg-slate-50"
                >
                  <option>This Week</option>

                  <option>Today</option>

                  <option>Next 3 Days</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Study Time Per Day
                </label>

                <select
                  value={plannerHours}
                  onChange={(e) => setPlannerHours(e.target.value)}
                  disabled={
                    loading ||
                    remainingMessages === null ||
                    remainingMessages <= 0
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#B45A2A] disabled:bg-slate-50"
                >
                  <option value="1">1 hour</option>

                  <option value="2">2 hours</option>

                  <option value="3">3 hours</option>

                  <option value="4">4 hours</option>

                  <option value="5">5 hours</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleGenerateStudyPlan}
                disabled={
                  loading ||
                  remainingMessages === null ||
                  remainingMessages <= 0
                }
                className="w-full rounded-xl bg-[#B45A2A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#984A22] disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading
                  ? "Generating..."
                  : remainingMessages === null || remainingMessages <= 0
                    ? "Daily Limit Reached"
                    : "Generate Study Plan"}
              </button>

              <p className="text-center text-[11px] leading-5 text-slate-400">
                Your plan is generated from your current SCM academic data.
              </p>
            </div>
          </section>

          <section className="flex min-h-[720px] flex-col rounded-2xl bg-white p-6 shadow-sm sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B45A2A]/10 text-[#B45A2A]">
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
                      d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.7 8.7 0 0 1-4-.9L3 20l1-4a8.4 8.4 0 0 1-.9-4c0-4.7 3.8-8.5 8.5-8.5s9.4 3.3 9.4 8Z"
                    />
                  </svg>
                </div>

                <div>
                  <h2 className="font-bold text-slate-900">Ask AI</h2>

                  <p className="text-xs text-slate-400">Get study guidance</p>
                </div>
              </div>

              <span className="rounded-full bg-[#F0EDE4] px-2.5 py-1 text-[11px] font-semibold text-[#B45A2A]">
                FREE
              </span>
            </div>

            <div
              ref={chatContainerRef}
              className="mt-5 min-h-[420px] max-h-[560px] flex-1 space-y-4 overflow-y-auto pr-2 scroll-smooth"
            >
              {messages.length === 0 && (
                <div className="rounded-xl bg-[#F0EDE4] p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#B45A2A] text-xs text-white">
                      AI
                    </span>

                    <p className="text-sm font-semibold text-slate-800">
                      Study Assistant
                    </p>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Hi! Ask me anything about your studies, courses, assignments
                    or exam preparation.
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "user"
                      ? "ml-8 rounded-xl bg-[#111827] p-4 text-white"
                      : "mr-2 rounded-xl bg-[#F0EDE4] p-4"
                  }
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
                        message.role === "user"
                          ? "bg-white text-slate-900"
                          : "bg-[#B45A2A] text-white"
                      }`}
                    >
                      {message.role === "user" ? "You" : "AI"}
                    </span>

                    <p
                      className={`text-sm font-semibold ${
                        message.role === "user"
                          ? "text-white"
                          : "text-slate-800"
                      }`}
                    >
                      {message.role === "user" ? "You" : "Study Assistant"}
                    </p>
                  </div>

                  <div
                    className={`mt-3 text-[14px] leading-7 ${
                      message.role === "user"
                        ? "text-white/90"
                        : "text-slate-600"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => (
                            <h1 className="mb-3 mt-4 text-lg font-bold text-slate-900">
                              {children}
                            </h1>
                          ),

                          h2: ({ children }) => (
                            <h2 className="mb-2 mt-4 text-base font-bold text-slate-900">
                              {children}
                            </h2>
                          ),

                          h3: ({ children }) => (
                            <h3 className="mb-2 mt-3 text-sm font-bold text-slate-900">
                              {children}
                            </h3>
                          ),

                          p: ({ children }) => (
                            <p className="mb-4 last:mb-0 leading-7">
                              {children}
                            </p>
                          ),

                          ul: ({ children }) => (
                            <ul className="mb-4 ml-5 list-disc space-y-2">
                              {children}
                            </ul>
                          ),

                          ol: ({ children }) => (
                            <ol className="mb-4 ml-5 list-decimal space-y-2">
                              {children}
                            </ol>
                          ),

                          li: ({ children }) => <li>{children}</li>,

                          strong: ({ children }) => (
                            <strong className="font-semibold text-slate-800">
                              {children}
                            </strong>
                          ),

                          code: ({ children }) => (
                            <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">
                              {children}
                            </code>
                          ),

                          blockquote: ({ children }) => (
                            <blockquote className="my-3 border-l-2 border-[#B45A2A] pl-3 italic">
                              {children}
                            </blockquote>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      message.content
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="mr-4 rounded-xl bg-[#F0EDE4] p-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#B45A2A] text-xs text-white">
                      AI
                    </span>

                    <p className="text-sm font-semibold text-slate-800">
                      Study Assistant
                    </p>
                  </div>

                  <div className="mt-3 flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />

                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />

                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
              <label className="text-sm font-medium text-slate-700">
                What do you need help with?
              </label>

              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. How should I prepare for my Database Management exam?"
                rows={4}
                disabled={
                  loading ||
                  remainingMessages === null ||
                  remainingMessages <= 0
                }
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#B45A2A] focus:ring-2 focus:ring-[#B45A2A]/10 disabled:bg-slate-50"
              />

              <button
                type="button"
                onClick={handleAskAI}
                disabled={
                  !question.trim() ||
                  loading ||
                  remainingMessages === null ||
                  remainingMessages <= 0
                }
                className="mt-3 w-full rounded-xl bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {loading
                  ? "Thinking..."
                  : remainingMessages === null || remainingMessages <= 0
                    ? "Daily Limit Reached"
                    : "Ask AI"}
              </button>

              <p className="mt-2 text-center text-[11px] text-slate-400">
                Press Enter to send • Shift + Enter for new line
              </p>
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Academic Overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your performance by subject.
              </p>
            </div>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 outline-none focus:border-[#B45A2A] lg:w-auto lg:min-w-56"
            >
              <option>All Subjects</option>

              {subjects.map((subject) => (
                <option key={subject.code} value={subject.name}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {overviewLoading ? (
              <div className="col-span-full py-8 text-center text-sm text-slate-400">
                Loading academic overview...
              </div>
            ) : overviewError ? (
              <div className="col-span-full rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                {overviewError}
              </div>
            ) : subjects.length === 0 ? (
              <div className="col-span-full py-8 text-center text-sm text-slate-400">
                No academic data available yet.
              </div>
            ) : (
              filteredSubjects.map((subject) => (
                <div
                  key={subject.code}
                  className="rounded-xl border border-slate-100 p-5"
                >
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-400">
                        {subject.code}
                      </p>

                      <h3 className="mt-1 break-words font-semibold text-slate-800">
                        {subject.name}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${
                        subject.status === "Strong"
                          ? "bg-green-50 text-green-600"
                          : subject.status === "Needs Focus"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-red-50 text-red-600"
                      }`}
                    >
                      {subject.status}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      Assignment progress
                    </span>

                    <span className="shrink-0 text-lg font-bold text-slate-800">
                      {subject.academicProgress}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#B45A2A] transition-all"
                      style={{
                        width: `${subject.academicProgress}%`,
                      }}
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                    <span className="text-xs text-slate-400">Attendance</span>

                    <span className="text-sm font-bold text-slate-700">
                      {subject.attendancePercentage === null
                        ? "Not recorded"
                        : `${subject.attendancePercentage}%`}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      Current Grade
                    </span>

                    <span className="text-sm font-bold text-slate-700">
                      {subject.grade}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-[#B45A2A]/10 bg-[#B45A2A]/5 p-6 sm:p-8">
          <div className="flex gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B45A2A] text-white">
              💡
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                Today&apos;s Study Tip
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Break difficult topics into smaller sections and test yourself
                after each section. Active recall can help you identify what you
                actually understand and what needs more review.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
