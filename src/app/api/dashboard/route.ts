import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis, getDailyKey } from "@/lib/redis";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adminId = session.adminId;

    const topicCount = await prisma.topic.count({
      where: { adminId, active: true },
    });

    const progress = await prisma.progress.findMany({
      where: { adminId },
      include: { topic: { select: { name: true } } },
      orderBy: { date: "desc" },
      take: 30,
    });

    const today = new Date().toISOString().slice(0, 10);
    const dateKey = await getDailyKey("topics");
    const todayTopicIds = await redis?.smembers(dateKey);

    let todayQuizTopics: string[] = [];
    if (todayTopicIds && todayTopicIds.length > 0) {
      const topics = await prisma.topic.findMany({
        where: { id: { in: todayTopicIds } },
        select: { name: true },
      });
      todayQuizTopics = topics.map((t) => t.name);
    }

    const totalScore = progress.reduce((sum, p) => sum + p.score, 0);
    const overallScore =
      progress.length > 0 ? Math.round(totalScore / progress.length) : null;

    const streak = calcStreak(progress.map((p) => p.date));

    const recentActivity = progress.slice(0, 10).map((p) => ({
      date: p.date,
      topic: p.topic.name,
      score: p.score,
      conceptsLearned: p.conceptsLearned,
    }));

    return NextResponse.json({
      activeTopics: topicCount,
      todayQuiz: todayQuizTopics.length > 0 ? todayQuizTopics : null,
      streak,
      overallScore,
      recentActivity,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}

function calcStreak(dates: (Date | string)[]): number {
  if (dates.length === 0) return 0;
  const sorted = dates
    .map((d) => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (sorted[i - 1].getTime() - sorted[i].getTime()) / 86400000;
    if (diff >= 0.5 && diff <= 1.5) streak++;
    else break;
  }
  return streak;
}
