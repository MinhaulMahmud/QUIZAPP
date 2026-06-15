import { prisma } from "@/lib/prisma";
import { redis, getDailyKey } from "@/lib/redis";
import { generateDailySummary, generateEmbedding } from "@/lib/ai";

export async function runMidnightCron(): Promise<void> {
  console.log("Midnight cron: Processing daily summary...");

  try {
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      console.log("Midnight cron: No admin found, skipping.");
      return;
    }

    const dateKey = await getDailyKey("topics");
    const topicIds = await redis?.smembers(dateKey);

    if (!topicIds || topicIds.length === 0) {
      console.log("Midnight cron: No quiz data today, skipping.");
      return;
    }

    for (const topicId of topicIds) {
      try {
        const quizKey = await getDailyKey(`quiz:${topicId}`);
        const quizData = await redis?.get(quizKey);

        if (!quizData) continue;

        const answersKey = await getDailyKey(`answers:${topicId}`);
        const userAnswersStr = await redis?.get(answersKey);
        const userAnswers = userAnswersStr ? JSON.parse(userAnswersStr) : [];

        const quiz = JSON.parse(quizData);
        const totalQuestions = quiz.questions?.length || 0;
        const correctCount = userAnswers.filter(
          (a: { isCorrect: boolean }) => a.isCorrect
        ).length;
        const score = totalQuestions > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;

        const dayLog = [
          "=== Today's Quiz ===",
          quizData,
          "=== User Answers ===",
          userAnswersStr || "No answers recorded",
        ].join("\n");

        // Generate summary and extract concepts
        const { summary, concepts } = await generateDailySummary(dayLog);

        // Generate embedding
        const embedding = await generateEmbedding(summary);
        const embeddingStr = `[${embedding.join(",")}]`;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if session already exists
        const existing = await prisma.dailySession.findFirst({
          where: {
            adminId: admin.id,
            topicId,
            date: today,
          },
        });

        if (existing) {
          await prisma.dailySession.update({
            where: { id: existing.id },
            data: { summary, embedding: embeddingStr },
          });
        } else {
          // Create daily session and questions
          const session = await prisma.dailySession.create({
            data: {
              adminId: admin.id,
              topicId,
              date: today,
              summary,
              embedding: embeddingStr,
            },
          });

          if (quiz.questions) {
            for (const q of quiz.questions) {
              const userAns = userAnswers.find(
                (a: { questionIndex: number }) =>
                  a.questionIndex === quiz.questions.indexOf(q)
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
          }
        }

        // Create/update progress record with real score
        await prisma.progress.upsert({
          where: {
            adminId_topicId_date: {
              adminId: admin.id,
              topicId,
              date: today,
            },
          },
          update: {
            conceptsLearned: concepts,
            score,
          },
          create: {
            adminId: admin.id,
            topicId,
            date: today,
            score,
            conceptsLearned: concepts,
          },
        });

        console.log(
          `Midnight cron: Processed topic ${topicId} — ${correctCount}/${totalQuestions} correct (${score}%)`
        );
      } catch (error) {
        console.error(`Midnight cron: Error for topic ${topicId}:`, error);
      }
    }

    // Clear Redis cache for the day
    const keys = await redis?.keys(
      `daily:${new Date().toISOString().slice(0, 10)}:*`
    );
    if (keys && keys.length > 0) {
      await redis?.del(...keys);
    }

    console.log("Midnight cron: Cache cleared.");
  } catch (error) {
    console.error("Midnight cron error:", error);
  }
}
