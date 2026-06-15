"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface RecentActivity {
  date: string;
  topic: string;
  score: number;
  conceptsLearned: string[];
}

interface DashboardData {
  activeTopics: number;
  todayQuiz: string[] | null;
  streak: number;
  overallScore: number | null;
  recentActivity: RecentActivity[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) setData(await res.json());
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-bold">Daily Quiz App</h1>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="font-medium">
            Dashboard
          </Link>
          <Link href="/topics" className="text-zinc-500 hover:text-foreground">
            Topics
          </Link>
          <Link
            href="/dashboard/progress"
            className="text-zinc-500 hover:text-foreground"
          >
            Progress
          </Link>
          <Link
            href="/dashboard/knowledge"
            className="text-zinc-500 hover:text-foreground"
          >
            Knowledge
          </Link>
          <Link href="/settings" className="text-zinc-500 hover:text-foreground">
            Settings
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <Link
            href="/topics"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            + Add Topic
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : !data ? (
          <p className="text-sm text-zinc-500">Failed to load dashboard data.</p>
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Active Topics"
                value={String(data.activeTopics)}
              />
              <StatCard
                label="Today's Quiz"
                value={
                  data.todayQuiz
                    ? data.todayQuiz.join(", ")
                    : "—"
                }
              />
              <StatCard
                label="Current Streak"
                value={`${data.streak} day${data.streak === 1 ? "" : "s"}`}
              />
              <StatCard
                label="Overall Score"
                value={
                  data.overallScore !== null
                    ? `${data.overallScore}%`
                    : "—"
                }
              />
            </div>

            <div className="rounded-lg border p-6">
              <h3 className="mb-4 font-semibold">Recent Activity</h3>
              {data.recentActivity.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No activity yet. Complete your first quiz to see progress here.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {data.recentActivity.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {a.topic}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(a.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {a.conceptsLearned.length > 0 && (
                          <p className="text-xs text-zinc-400">
                            {a.conceptsLearned.slice(0, 2).join(", ")}
                          </p>
                        )}
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            a.score >= 70
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : a.score >= 40
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                          }`}
                        >
                          {a.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="truncate text-3xl font-bold">{value}</p>
    </div>
  );
}
