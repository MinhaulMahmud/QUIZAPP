"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ProgressRecord {
  id: string;
  date: string;
  score: number;
  conceptsLearned: string[];
  topic: { name: string };
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/progress");
        if (res.ok) setData(await res.json());
      } catch {
        // ignore
      }
      setLoading(false);
    }
    load();
  }, []);

  const chartData = data
    .slice()
    .reverse()
    .map((p) => ({
      date: new Date(p.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      score: p.score,
      topic: p.topic.name,
    }));

  const avgScore =
    data.length > 0
      ? Math.round(data.reduce((s, p) => s + p.score, 0) / data.length)
      : 0;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-bold">Daily Quiz App</h1>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/dashboard" className="text-zinc-500 hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/topics" className="text-zinc-500 hover:text-foreground">
            Topics
          </Link>
          <Link href="/dashboard/progress" className="font-medium">
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

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Progress</h2>
          {data.length > 0 && (
            <p className="text-sm text-zinc-500">
              Average: <span className="font-semibold">{avgScore}%</span>
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : data.length === 0 ? (
          <div className="rounded-lg border p-6">
            <p className="text-sm text-zinc-500">
              Progress charts will appear here once you complete some quizzes.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border p-6">
              <h3 className="mb-4 font-semibold">Score Trend</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-700" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        fontSize: 13,
                        borderRadius: 8,
                      }}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      formatter={(value: any, _name: any, props: any) => [
                        `${value}%`,
                        props.payload.topic,
                      ]}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="var(--foreground)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-lg border p-6">
              <h3 className="mb-4 font-semibold">History</h3>
              <div className="flex flex-col gap-3">
                {data.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.topic.name}</p>
                      <p className="text-xs text-zinc-500">
                        {new Date(p.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.conceptsLearned.length > 0 && (
                        <p className="max-w-48 truncate text-xs text-zinc-400">
                          {p.conceptsLearned.join(", ")}
                        </p>
                      )}
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          p.score >= 70
                            ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                            : p.score >= 40
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                              : "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {p.score}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
