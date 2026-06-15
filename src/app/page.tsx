import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center gap-12 px-6 py-24">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-5xl font-bold tracking-tight">
            Daily Quiz App
          </h1>
          <p className="max-w-lg text-lg text-zinc-600 dark:text-zinc-400">
            AI-powered daily quizzes and practice sessions to build solid skills
            in anything. Track your progress, identify weak spots, and level up
            every day.
          </p>
        </div>

        <div className="flex gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-80"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-lg border p-6">
            <h3 className="font-semibold">Daily Quizzes</h3>
            <p className="text-sm text-zinc-500">
              5 questions every day, tailored to your learning topics and
              difficulty level.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border p-6">
            <h3 className="font-semibold">Practice Sessions</h3>
            <p className="text-sm text-zinc-500">
              Interactive practice targeting your weak areas, with instant AI
              feedback.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border p-6">
            <h3 className="font-semibold">Progress Tracking</h3>
            <p className="text-sm text-zinc-500">
              Visual charts and a searchable knowledge base to review past
              material.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
