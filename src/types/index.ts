export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface QuizData {
  topic: string;
  questions: QuizQuestion[];
  generatedAt: string;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  hint: string;
  expectedOutcome: string;
}

export interface ProgressData {
  date: string;
  score: number;
  topic: string;
  totalQuestions: number;
  correctAnswers: number;
  conceptsLearned: string[];
}

export interface TopicSummary {
  name: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  active: boolean;
}

export interface DailySummary {
  date: string;
  topic: string;
  summary: string;
  score: number;
  conceptsLearned: string[];
}
