import { Telegraf } from "telegraf";
import type { InlineKeyboardButton } from "telegraf/types";
import { getSetting } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { redis, getDailyKey } from "@/lib/redis";
import { generateQuiz } from "@/lib/ai";

let bot: Telegraf | null = null;
let handlersSetup = false;

export async function getBot(): Promise<Telegraf | null> {
  if (bot) return bot;
  const token = await getSetting("telegram_bot_token");
  if (!token) return null;
  bot = new Telegraf(token);
  return bot;
}

export async function launchBot(): Promise<Telegraf | null> {
  const b = await getBot();
  if (!b) return null;
  setupBotHandlers(b);
  try {
    // Clear any existing webhook first
    const token = await getSetting("telegram_bot_token");
    if (token) {
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, {
        method: "POST",
      });
    }
    b.launch().catch((err) => console.error("Bot polling error:", err));
    console.log("Bot started in polling mode");
  } catch {
    console.log("Bot polling already running or not available");
  }
  return b;
}

export async function restartBot(): Promise<void> {
  if (bot) {
    try { await bot.stop(); } catch { /* ignore */ }
    bot = null;
    handlersSetup = false;
  }
}

export function setupBotHandlers(bot: Telegraf): void {
  if (handlersSetup) return;
  handlersSetup = true;

  bot.start(async (ctx) => {
    const chatId = ctx.chat?.id;
    if (chatId) {
      await prisma.setting.upsert({
        where: { key: "telegram_chat_id" },
        update: { value: String(chatId) },
        create: { key: "telegram_chat_id", value: String(chatId) },
      });
    }
    await ctx.reply(
      "Welcome to Daily Quiz App! 📚\n\n" +
        "I'll send you daily quizzes to help you build skills.\n\n" +
        "Your chat ID has been registered! You can now receive daily quizzes.\n\n" +
        "Commands:\n" +
        "/quiz - Get today's quiz\n" +
        "/practice - Start a practice session\n" +
        "/topic - View your active topics\n" +
        "/stats - View your progress\n" +
        "/help - Show this message"
    );
  });

  bot.help(async (ctx) => {
    await ctx.reply(
      "Available commands:\n\n" +
        "/quiz - Get today's quiz questions\n" +
        "/practice - Practice on weak areas\n" +
        "/topic - See your active learning topics\n" +
        "/stats - Check your progress\n" +
        "/help - Show this message"
    );
  });

  bot.command("quiz", async (ctx) => {
    try {
      const admin = await prisma.admin.findFirst();
      if (!admin) {
        await ctx.reply("No admin found. Please set up the app first.");
        return;
      }

      const activeTopics = await prisma.topic.findMany({
        where: { adminId: admin.id, active: true },
      });

      if (activeTopics.length === 0) {
        await ctx.reply("No active topics. Add some from the dashboard!");
        return;
      }

      for (const topic of activeTopics) {
        const quizKey = await getDailyKey(`quiz:${topic.id}`);
        const lockKey = await getDailyKey(`generating:${topic.id}`);
        let quizData = await redis?.get(quizKey);

        // Guard: skip if already being generated (prevents duplicate /quiz spam)
        if (!quizData) {
          const locked = await redis?.setnx(lockKey, "1");
          if (locked === 0) {
            await ctx.reply(`Quiz for "${topic.name}" is already being generated. Please wait...`);
            continue;
          }
          await redis?.expire(lockKey, 120);

          await ctx.reply(`🧠 Generating quiz for "${topic.name}"...`);
          const prevQuestions = await getPreviousQuestions(topic.id);
          const quizJson = await generateQuiz(topic.name, topic.difficulty, undefined, prevQuestions);
          quizData = quizJson;
          await redis?.set(quizKey, quizJson, "EX", 86400);
          const dateKey = await getDailyKey("topics");
          await redis?.sadd(dateKey, topic.id);
          await redis?.del(lockKey);
        }

        const quiz = JSON.parse(quizData);
        if (!quiz.questions || quiz.questions.length === 0) {
          await ctx.reply(`Failed to generate quiz for "${topic.name}".`);
          continue;
        }

        await ctx.reply(
          `📚 *Daily Quiz: ${topic.name}* (${topic.difficulty})\n_Answer by tapping the options below._`,
          { parse_mode: "Markdown" }
        );
        for (let i = 0; i < quiz.questions.length; i++) {
          await sendQuestion(ctx.chat.id, topic.id, quiz, i);
        }
      }
    } catch (error) {
      console.error("Quiz command error:", error);
      await ctx.reply("Something went wrong. Try again later.");
    }
  });

  bot.command("practice", async (ctx) => {
    try {
      const admin = await prisma.admin.findFirst();
      if (!admin) {
        await ctx.reply("No admin found. Please set up the app first.");
        return;
      }

      const recentWrong = await prisma.progress.findMany({
        where: { adminId: admin.id },
        orderBy: { date: "desc" },
        take: 5,
        include: { topic: { select: { name: true, id: true, difficulty: true } } },
      });

      if (recentWrong.length === 0) {
        await ctx.reply("No practice data yet. Complete some quizzes first!");
        return;
      }

      const weakAreas = recentWrong
        .filter((p) => p.score < 60)
        .map((p) => p.topic.name);

      const targetTopics =
        weakAreas.length > 0
          ? recentWrong.filter((p) => p.topic.name === weakAreas[0])
          : [recentWrong[0]];

      const topic = targetTopics[0].topic;
      await ctx.reply(`🧠 Generating practice quiz for "${topic.name}"...`);

      const weakHint =
        weakAreas.length > 0 ? `Focus on: ${weakAreas.slice(0, 3).join(", ")}` : undefined;
      const prevQuestions = await getPreviousQuestions(topic.id);
      const quizJson = await generateQuiz(topic.name, topic.difficulty, weakHint, prevQuestions);
      const quiz = JSON.parse(quizJson);

      await ctx.reply(
        `🧠 *Practice: ${topic.name}*\n_Tap an option to answer._`,
        { parse_mode: "Markdown" }
      );
      for (let i = 0; i < quiz.questions.length; i++) {
        await sendQuestion(ctx.chat.id, `practice_${topic.id}`, quiz, i);
      }
    } catch (error) {
      console.error("Practice command error:", error);
      await ctx.reply("Something went wrong. Try again later.");
    }
  });

  bot.command("topic", async (ctx) => {
    try {
      const admin = await prisma.admin.findFirst();
      if (!admin) {
        await ctx.reply("No admin found. Please set up the app first.");
        return;
      }

      const topics = await prisma.topic.findMany({
        where: { adminId: admin.id },
        orderBy: { createdAt: "desc" },
      });

      if (topics.length === 0) {
        await ctx.reply("No topics yet. Add some from the dashboard!");
        return;
      }

      const lines = topics.map(
        (t) =>
          `${t.active ? "✅" : "⏸️"} *${t.name}* (${t.difficulty})${t.completed ? " — ✅ completed" : ` — ${t.quizCount} quizzes done`}`
      );
      await ctx.reply(`*Your Topics:*\n\n${lines.join("\n")}`, {
        parse_mode: "Markdown",
      });
    } catch (error) {
      console.error("Topic command error:", error);
      await ctx.reply("Something went wrong.");
    }
  });

  bot.command("stats", async (ctx) => {
    try {
      const admin = await prisma.admin.findFirst();
      if (!admin) {
        await ctx.reply("No admin found. Please set up the app first.");
        return;
      }

      const progress = await prisma.progress.findMany({
        where: { adminId: admin.id },
        orderBy: { date: "desc" },
        take: 30,
        include: { topic: { select: { name: true } } },
      });

      if (progress.length === 0) {
        await ctx.reply("No stats yet. Complete some quizzes first!");
        return;
      }

      const totalQuizzes = progress.length;
      const avgScore =
        progress.reduce((sum, p) => sum + p.score, 0) / totalQuizzes;
      const recent5 = progress.slice(0, 5);
      const streak = calcStreak(progress.map((p) => p.date));

      const topics = await prisma.topic.findMany({
        where: { adminId: admin.id },
        select: { name: true, quizCount: true, completed: true },
      });
      const completedTopics = topics.filter((t) => t.completed).length;
      const topicSummary = topics
        .filter((t) => !t.completed)
        .map((t) => `${t.name} (${t.quizCount} quizzes)`).join(", ");

      const lines = [
        `📊 *Your Progress Stats*`,
        ``,
        `Total quizzes: ${totalQuizzes}`,
        `Average score: ${avgScore.toFixed(1)}%`,
        `Current streak: ${streak} day${streak === 1 ? "" : "s"}`,
        `Topics completed: ${completedTopics}`,
        topicSummary ? `In progress: ${topicSummary}` : null,
        ``,
        `*Recent:*`,
        ...recent5.map(
          (p) =>
            `  ${new Date(p.date).toLocaleDateString()} — *${p.topic.name}* — ${p.score}%`
        ),
      ].filter(Boolean);

      await ctx.reply(lines.join("\n"));
    } catch (error) {
      console.error("Stats command error:", error instanceof Error ? error.stack : error);
      await ctx.reply("Something went wrong.");
    }
  });

  bot.on("callback_query", async (ctx) => {
    try {
      if (!("data" in ctx.callbackQuery)) return;
      const data = (ctx.callbackQuery as { data: string }).data;
      if (!data || data === "noop") {
        await ctx.answerCbQuery();
        return;
      }
      if (!data.startsWith("answer:")) return;

      const parts = data.split(":");
      if (parts.length < 4) return;

      const [, topicId, questionIndexStr, optionIndexStr] = parts;
      const questionIndex = parseInt(questionIndexStr);
      const optionIndex = parseInt(optionIndexStr);

      const quizKey = await getDailyKey(`quiz:${topicId}`);
      const quizData = await redis?.get(quizKey);

      if (!quizData) {
        await ctx.answerCbQuery("This quiz has expired!");
        return;
      }

      const quiz = JSON.parse(quizData);
      const question = quiz.questions[questionIndex];

      if (!question) {
        await ctx.answerCbQuery("Question not found!");
        return;
      }

      const selectedOption = question.options[optionIndex];
      const correctOption = question.options[question.correctAnswer];
      const isCorrect = optionIndex === question.correctAnswer;

      const answersKey = await getDailyKey(`answers:${topicId}`);
      const existingAnswers = await redis?.get(answersKey);
      const answers = existingAnswers ? JSON.parse(existingAnswers) : [];
      answers.push({
        questionIndex,
        selectedOption,
        correctOption,
        isCorrect,
        questionText: question.question,
      });
      await redis?.set(answersKey, JSON.stringify(answers), "EX", 86400);

      await ctx.answerCbQuery(isCorrect ? "✅" : "❌");

      if (
        ctx.callbackQuery.message &&
        "reply_markup" in ctx.callbackQuery.message
      ) {
        await ctx.editMessageReplyMarkup({
          inline_keyboard: disableButtons(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ctx.callbackQuery.message as any).reply_markup?.inline_keyboard || []
          ),
        });
      }

      const answeredIndices = new Set(
        answers
          .filter((a: { questionIndex: number }) => a.questionIndex < quiz.questions.length)
          .map((a: { questionIndex: number }) => a.questionIndex)
      );
      if (answeredIndices.size < quiz.questions.length) return;

      const total = quiz.questions.length;
      const seen = new Set<number>();
      const uniqueAnswers = answers.filter((a: { questionIndex: number }) => {
        if (seen.has(a.questionIndex)) return false;
        seen.add(a.questionIndex);
        return true;
      });
      const correctCount = uniqueAnswers.filter((a: { isCorrect: boolean }) => a.isCorrect).length;
      const pct = Math.round((correctCount / total) * 100);

      const resultLines = uniqueAnswers
        .sort((a: { questionIndex: number }, b: { questionIndex: number }) => a.questionIndex - b.questionIndex)
        .map(
          (a: { questionText: string; isCorrect: boolean; correctOption: string; selectedOption: string; questionIndex: number }, i: number) =>
            `${i + 1}. ${a.isCorrect ? "✅" : "❌"} ${a.questionText}\n   Your answer: ${a.selectedOption} | Correct: ${a.correctOption}`
        );

      await ctx.reply(
        `🎉 *Quiz Complete!*\n\nYou got *${correctCount}/${total}* correct (${pct}%).\n\n${resultLines.join("\n\n")}`,
        { parse_mode: "Markdown" }
      );

      // Save results immediately so /stats and knowledge base work without waiting for midnight cron
      try {
        const admin = await prisma.admin.findFirst();
        if (admin) {
          const cleanTopicId = topicId.replace(/^practice_/, "");
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          let session = await prisma.dailySession.findFirst({
            where: { adminId: admin.id, topicId: cleanTopicId, date: today },
          });

          if (!session) {
            session = await prisma.dailySession.create({
              data: {
                adminId: admin.id,
                topicId: cleanTopicId,
                date: today,
                summary: "",
              },
            });
          }

          await prisma.question.deleteMany({ where: { sessionId: session.id } });

          for (let qi = 0; qi < quiz.questions.length; qi++) {
            const q = quiz.questions[qi];
            const userAns = answers.find(
              (a: { questionIndex: number }) => a.questionIndex === qi
            );
            await prisma.question.create({
              data: {
                sessionId: session.id,
                questionText: q.question,
                correctAnswer: q.options[q.correctAnswer],
                userAnswer: userAns?.selectedOption || null,
                isCorrect: userAns?.isCorrect ?? null,
                feedback: q.explanation || null,
              },
            });
          }

          await prisma.progress.upsert({
            where: {
              adminId_topicId_date: {
                adminId: admin.id,
                topicId: cleanTopicId,
                date: today,
              },
            },
            update: { score: pct },
            create: {
              adminId: admin.id,
              topicId: cleanTopicId,
              date: today,
              score: pct,
              conceptsLearned: [],
            },
          });

          await prisma.topic.update({
            where: { id: cleanTopicId },
            data: { quizCount: { increment: 1 } },
          });
        }
      } catch (saveError) {
        console.error("Failed to save quiz results:", saveError);
      }
    } catch (error) {
      console.error("Callback query error:", error);
      await ctx.answerCbQuery("Error processing answer");
    }
  });
}

async function sendQuestion(
  chatId: number,
  topicId: string,
  quiz: { questions: { question: string; options: string[] }[] },
  index: number
): Promise<void> {
  if (!bot) return;
  const q = quiz.questions[index];
  const keyboard: InlineKeyboardButton[][] = q.options.map((opt, i) => [
    {
      text: `${String.fromCharCode(65 + i)}. ${opt}`,
      callback_data: `answer:${topicId}:${index}:${i}`,
    },
  ]);

  await bot.telegram.sendMessage(
    chatId,
    `*Q${index + 1}:* ${q.question}`,
    {
      parse_mode: "Markdown",
      reply_markup: { inline_keyboard: keyboard },
    }
  );
}

async function getPreviousQuestions(topicId: string): Promise<string[]> {
  try {
    const questions = await prisma.question.findMany({
      where: { session: { topicId } },
      select: { questionText: true },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return questions.map((q) => q.questionText);
  } catch {
    return [];
  }
}

function disableButtons(keyboard: InlineKeyboardButton[][]): InlineKeyboardButton[][] {
  return keyboard.map((row) =>
    row.map((btn) => ({ ...btn, callback_data: "noop" }))
  );
}

function calcStreak(dates: Date[] | string[]): number {
  if (dates.length === 0) return 0;
  const sorted = dates
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i - 1].getTime() - sorted[i].getTime()) / 86400000;
    if (diff <= 1.5 && diff >= 0.5) streak++;
    else break;
  }
  return streak;
}
