"use client";

import { useState, useEffect } from "react";
import NavHeader from "@/components/ui/NavHeader";

interface Topic {
  id: string;
  name: string;
  difficulty: string;
  active: boolean;
}

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [name, setName] = useState("");
  const [difficulty, setDifficulty] = useState("beginner");
  const [loading, setLoading] = useState(true);

  async function loadTopics() {
    const res = await fetch("/api/topics");
    if (res.ok) setTopics(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadTopics();
  }, []);

  async function addTopic(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/topics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, difficulty }),
    });
    if (res.ok) {
      setName("");
      loadTopics();
    }
  }

  async function toggleActive(topic: Topic) {
    await fetch(`/api/topics`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: topic.id, active: !topic.active }),
    });
    loadTopics();
  }

  async function deleteTopic(id: string) {
    await fetch(`/api/topics`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadTopics();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <NavHeader />
      <main className="flex flex-1 flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
        <h2 className="text-2xl font-bold">Topics</h2>

        <form onSubmit={addTopic} className="flex gap-3">
          <input
            type="text"
            placeholder="Topic name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="flex-1 rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
          />
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          <button
            type="submit"
            className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Add
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-zinc-500">Loading...</p>
        ) : topics.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No topics yet. Add one above!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">{topic.name}</p>
                  <p className="text-xs text-zinc-500">{topic.difficulty}</p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleActive(topic)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      topic.active
                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800"
                    }`}
                  >
                    {topic.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => deleteTopic(topic.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
