"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step =
  | "welcome"
  | "telegram"
  | "openrouter"
  | "topic"
  | "schedule"
  | "done";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [telegramToken, setTelegramToken] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [topicName, setTopicName] = useState("");
  const [topicDifficulty, setTopicDifficulty] = useState("beginner");
  const [quizTime, setQuizTime] = useState("08:00");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleNext() {
    setError("");
    setLoading(true);
    try {
      switch (step) {
        case "telegram":
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: "telegram_bot_token",
              value: telegramToken,
            }),
          });
          break;
        case "openrouter":
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: "openrouter_api_key",
              value: openrouterKey,
            }),
          });
          break;
        case "topic":
          if (topicName.trim()) {
            await fetch("/api/topics", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: topicName.trim(),
                difficulty: topicDifficulty,
              }),
            });
          }
          break;
        case "schedule":
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "quiz_time", value: quizTime }),
          });
          await fetch("/api/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "setup_complete", value: "true" }),
          });
          break;
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }
    setLoading(false);
    const steps: Step[] = [
      "welcome",
      "telegram",
      "openrouter",
      "topic",
      "schedule",
      "done",
    ];
    const idx = steps.indexOf(step);
    setStep(steps[idx + 1]);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex items-center gap-2">
          {["welcome", "telegram", "openrouter", "topic", "schedule", "done"]
            .slice(0, -1)
            .map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    step === s
                      ? "bg-foreground text-background"
                      : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 4 && <div className="h-px w-6 bg-zinc-300 dark:bg-zinc-700" />}
              </div>
            ))}
        </div>

        <div className="rounded-lg border p-8">
          {step === "welcome" && (
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl font-bold">Welcome!</h1>
              <p className="text-zinc-500">
                Let&apos;s set up your Daily Quiz App in a few steps. You&apos;ll
                need your Telegram Bot Token and OpenRouter API Key ready.
              </p>
              <button
                onClick={handleNext}
                className="mt-4 rounded-lg bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 self-start"
              >
                Start Setup
              </button>
            </div>
          )}

          {step === "telegram" && (
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl font-bold">Telegram Bot Token</h1>
              <p className="text-sm text-zinc-500">
                Get this from{" "}
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  BotFather
                </a>{" "}
                on Telegram.
              </p>
              <input
                type="password"
                placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                className="rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("openrouter")}
                  className="rounded-lg border px-4 py-2 text-sm font-medium"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  disabled={!telegramToken || loading}
                  className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          )}

          {step === "openrouter" && (
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl font-bold">OpenRouter API Key</h1>
              <p className="text-sm text-zinc-500">
                Get your key from{" "}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  openrouter.ai/keys
                </a>
                .
              </p>
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={openrouterKey}
                onChange={(e) => setOpenrouterKey(e.target.value)}
                className="rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("topic")}
                  className="rounded-lg border px-4 py-2 text-sm font-medium"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  disabled={!openrouterKey || loading}
                  className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          )}

          {step === "topic" && (
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl font-bold">Your First Topic</h1>
              <p className="text-sm text-zinc-500">
                What do you want to learn? You can add more later.
              </p>
              <input
                type="text"
                placeholder="e.g., English Vocabulary"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                className="rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <select
                value={topicDifficulty}
                onChange={(e) => setTopicDifficulty(e.target.value)}
                className="rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("schedule")}
                  className="rounded-lg border px-4 py-2 text-sm font-medium"
                >
                  Skip
                </button>
                <button
                  onClick={handleNext}
                  disabled={!topicName || loading}
                  className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          )}

          {step === "schedule" && (
            <div className="flex flex-col gap-4">
              <h1 className="text-2xl font-bold">Quiz Schedule</h1>
              <p className="text-sm text-zinc-500">
                Set the time for your daily quiz.
              </p>
              <input
                type="time"
                value={quizTime}
                onChange={(e) => setQuizTime(e.target.value)}
                className="rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <button
                onClick={handleNext}
                disabled={loading}
                className="rounded-lg bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 disabled:opacity-50 self-start"
              >
                {loading ? "Saving..." : "Finish Setup"}
              </button>
            </div>
          )}

          {step === "done" && (
            <div className="flex flex-col gap-4 text-center">
              <h1 className="text-2xl font-bold">All Set!</h1>
              <p className="text-zinc-500">
                Your Daily Quiz App is ready. You can now configure topics,
                view progress, and manage settings from the dashboard.
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="rounded-lg bg-foreground px-6 py-2 text-sm font-medium text-background transition-opacity hover:opacity-80 self-center"
              >
                Go to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
