"use client";

import { useState, useEffect } from "react";
import NavHeader from "@/components/ui/NavHeader";

export default function SettingsPage() {
  const [telegramToken, setTelegramToken] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [ollamaUrl, setOllamaUrl] = useState("");
  const [quizTime, setQuizTime] = useState("08:00");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings");
        if (!res.ok) return;
        const data = await res.json();
        if (data.telegram_bot_token) setTelegramToken(data.telegram_bot_token);
        if (data.openrouter_api_key) setOpenrouterKey(data.openrouter_api_key);
        if (data.ollama_base_url) setOllamaUrl(data.ollama_base_url);
        if (data.quiz_time) setQuizTime(data.quiz_time);
      } catch {}
    }
    load();
  }, []);

  async function saveSetting(key: string, value: string) {
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to save");
        return;
      }
      setMessage("Saved!");
    } catch {
      setError("Failed to save");
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader />
      <main className="flex flex-1 flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
        <h2 className="text-2xl font-bold">Settings</h2>

        {message && (
          <p className="rounded-lg bg-green-100 px-4 py-2 text-sm text-green-700 dark:bg-green-900 dark:text-green-300">
            {message}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-100 px-4 py-2 text-sm text-red-600 dark:bg-red-900 dark:text-red-300">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <h3 className="font-semibold">Telegram Bot Token</h3>
            <input
              type="password"
              value={telegramToken}
              onChange={(e) => setTelegramToken(e.target.value)}
              className="rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <button
              onClick={() => {
                saveSetting("telegram_bot_token", telegramToken);
              }}
              className="self-start rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Save
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <h3 className="font-semibold">OpenRouter API Key</h3>
            <input
              type="password"
              value={openrouterKey}
              onChange={(e) => setOpenrouterKey(e.target.value)}
              className="rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <button
              onClick={() => saveSetting("openrouter_api_key", openrouterKey)}
              className="self-start rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Save
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <h3 className="font-semibold">Ollama Base URL (optional)</h3>
            <input
              type="text"
              placeholder="http://localhost:11434/v1"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              className="rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <button
              onClick={() => saveSetting("ollama_base_url", ollamaUrl)}
              className="self-start rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Save
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border p-4">
            <h3 className="font-semibold">Daily Quiz Time</h3>
            <input
              type="time"
              value={quizTime}
              onChange={(e) => setQuizTime(e.target.value)}
              className="self-start rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <button
              onClick={() => saveSetting("quiz_time", quizTime)}
              className="self-start rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
            >
              Save
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
