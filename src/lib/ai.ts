import OpenAI from "openai";
import { getSetting } from "./settings";

let openaiClient: OpenAI | null = null;

async function getClient(): Promise<OpenAI> {
  if (openaiClient) return openaiClient;

  const apiKey = await getSetting("openrouter_api_key");
  const ollamaUrl = await getSetting("ollama_base_url");

  if (ollamaUrl) {
    openaiClient = new OpenAI({
      baseURL: ollamaUrl,
      apiKey: "ollama",
    });
  } else if (apiKey) {
    openaiClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Daily Quiz App",
      },
    });
  } else {
    throw new Error("No AI provider configured. Set OpenRouter API key or Ollama URL in settings.");
  }

  return openaiClient;
}

export async function resetClient(): Promise<void> {
  openaiClient = null;
}

export async function generateQuiz(
  topic: string,
  difficulty: string,
  weakAreas?: string,
  previousQuestions?: string[]
): Promise<string> {
  const client = await getClient();

  const weakAreaHint = weakAreas ? `\nFocus extra attention on these weak areas: ${weakAreas}` : "";
  const prevQHint = (previousQuestions && previousQuestions.length > 0)
    ? `\nPreviously asked questions (DO NOT repeat any of these):\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
    : "";

  const response = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a quiz generator. Generate exactly 5 multiple-choice quiz questions.
Each question must have 4 options (A, B, C, D) with exactly one correct answer.
CRITICAL: Never repeat or rephrase any previously asked questions. Cover new subtopics and aspects.
Return ONLY valid JSON with this exact structure, no markdown formatting:
{
  "topic": "${topic}",
  "questions": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}`,
      },
      {
        role: "user",
        content: `Generate 5 quiz questions about "${topic}" at ${difficulty} level.${weakAreaHint}${prevQHint}`,
      },
    ],
    response_format: { type: "json_object" },
  });

  return response.choices[0]?.message?.content || "";
}

export async function evaluateAnswer(
  question: string,
  correctAnswer: string,
  userAnswer: string,
  topic: string
): Promise<string> {
  const client = await getClient();

  const response = await client.chat.completions.create({
    model: "google/gemini-2.0-flash-exp:free",
    messages: [
      {
        role: "system",
        content: "You are a quiz evaluator. Provide concise feedback on the user's answer. Be encouraging but honest.",
      },
      {
        role: "user",
        content: `Topic: ${topic}
Question: ${question}
Correct Answer: ${correctAnswer}
User's Answer: ${userAnswer}

Is the user correct? Explain briefly.`,
      },
    ],
  });

  return response.choices[0]?.message?.content || "Unable to evaluate.";
}

export async function generateDailySummary(
  dayLog: string
): Promise<{ summary: string; concepts: string[] }> {
  const client = await getClient();

  const response = await client.chat.completions.create({
    model: "openai/gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Summarize the day's learning from the conversation log.
Extract key concepts learned, and provide a brief summary.
Return ONLY valid JSON: { "summary": "...", "concepts": ["concept1", "concept2", ...] }`,
      },
      {
        role: "user",
        content: dayLog,
      },
    ],
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || '{"summary":"","concepts":[]}';
  return JSON.parse(content);
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = await getClient();

  const response = await client.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });

  return response.data[0]?.embedding || [];
}
