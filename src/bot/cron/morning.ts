import { getSetting } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { redis, getDailyKey } from "@/lib/redis";
import { generateQuiz } from "@/lib/ai";
import { getBot } from "@/bot";

export async function runMorningCron(): Promise<void> {
  console.log("Morning cron: Starting daily quiz generation...");

  try {
    const bot = await getBot();
    if (!bot) {
      console.log("Morning cron: Bot not configured, skipping.");
      return;
    }

    const admin = await prisma.admin.findFirst();
    if (!admin) {
      console.log("Morning cron: No admin found, skipping.");
      return;
    }

    const chatIdStr =
      process.env.TELEGRAM_CHAT_ID || (await getSetting("telegram_chat_id"));
    if (!chatIdStr) {
      console.log("Morning cron: No chat ID registered. Send /start to the bot first.");
      return;
    }
    const chatId = parseInt(chatIdStr);

    const activeTopics = await prisma.topic.findMany({
      where: { adminId: admin.id, active: true },
    });

    if (activeTopics.length === 0) {
      console.log("Morning cron: No active topics, skipping.");
      return;
    }

    for (const topic of activeTopics) {
      try {
        const quizJson = await generateQuiz(topic.name, topic.difficulty);
        const quiz = JSON.parse(quizJson);

        if (!quiz.questions || quiz.questions.length === 0) {
          console.log(`Morning cron: No questions generated for ${topic.name}`);
          continue;
        }

        // Store quiz in Redis for the day
        const quizKey = await getDailyKey(`quiz:${topic.id}`);
        await redis?.set(quizKey, JSON.stringify(quiz), "EX", 86400);

        const dateKey = await getDailyKey(`topics`);
        await redis?.sadd(dateKey, topic.id);

        // Send header
        await bot.telegram.sendMessage(
          chatId,
          `🌅 *Daily Quiz: ${topic.name}* (${topic.difficulty})\n_Tap an option to answer each question._`,
          { parse_mode: "Markdown" }
        );

        // Send each question with inline keyboard
        for (let i = 0; i < quiz.questions.length; i++) {
          const q = quiz.questions[i];
          const keyboard = q.options.map(
            (opt: string, j: number) => [
              {
                text: `${String.fromCharCode(65 + j)}. ${opt}`,
                callback_data: `answer:${topic.id}:${i}:${j}`,
              },
            ]
          );

          await bot.telegram.sendMessage(
            chatId,
            `*Q${i + 1}:* ${q.question}`,
            {
              parse_mode: "Markdown",
              reply_markup: { inline_keyboard: keyboard },
            }
          );
        }

        console.log(`Morning cron: Quiz sent for topic "${topic.name}"`);
      } catch (error) {
        console.error(`Morning cron: Error for topic "${topic.name}":`, error);
      }
    }
  } catch (error) {
    console.error("Morning cron error:", error);
  }
}
