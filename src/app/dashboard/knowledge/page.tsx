"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Question {
  questionText: string;
  correctAnswer: string;
  isCorrect: boolean | null;
  feedback: string | null;
}

interface Session {
  id: string;
  date: string;
  summary: string;
  topic: { name: string };
  questions: Question[];
}

export default function KnowledgePage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const load = useCallback(async (q?: string) => {
    setSearching(true);
    try {
      const url = q ? `/api/knowledge?q=${encodeURIComponent(q)}` : "/api/knowledge";
      const res = await fetch(url);
      if (res.ok) setSessions(await res.json());
    } catch {
      // ignore
    }
    setSearching(false);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    load(query || undefined);
  }

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
          <Link
            href="/dashboard/progress"
            className="text-zinc-500 hover:text-foreground"
          >
            Progress
          </Link>
          <Link href="/dashboard/knowledge" className="font-medium">
            Knowledge
          </Link>
          <Link href="/settings" className="text-zinc-500 hover:text-foreground">
            Settings
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
        <h2 className="text-2xl font-bold">Knowledge Base</h2>

        <form onSubmit={handleSearch} className="flex gap-3">
          <input
            type="text"
            placeholder="Search past sessions, concepts, or questions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <button
            type="submit"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Search
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : sessions.length === 0 ? (
          <div className="rounded-lg border p-6">
            <p className="text-sm text-zinc-500">
              {query
                ? "No results found for your search."
                : "Search through past concepts and sessions once you have some data."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-lg border p-5">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{session.topic.name}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(session.date).toLocaleDateString()}
                    </p>
                  </div>
                  {session.summary && (
                    <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      Summary available
                    </span>
                  )}
                </div>

                {session.summary && (
                  <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {session.summary}
                  </p>
                )}

                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-zinc-500 hover:text-foreground">
                    Questions ({session.questions.length})
                  </summary>
                  <div className="mt-3 flex flex-col gap-3">
                    {session.questions.map((q, i) => (
                      <div
                        key={i}
                        className="rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
                      >
                        <p className="text-sm font-medium">{q.questionText}</p>
                        <p className="mt-1 text-xs text-zinc-500">
                          Answer: {q.correctAnswer}
                        </p>
                        {q.isCorrect !== null && (
                          <p
                            className={`mt-1 text-xs ${
                              q.isCorrect
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {q.isCorrect ? "✅ Correct" : "❌ Incorrect"}
                            {q.feedback && ` — ${q.feedback}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
