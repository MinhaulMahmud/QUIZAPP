import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    const sessions = await prisma.dailySession.findMany({
      where: { adminId: session.adminId },
      include: {
        topic: { select: { name: true } },
        questions: {
          select: {
            questionText: true,
            correctAnswer: true,
            isCorrect: true,
            feedback: true,
          },
        },
      },
      orderBy: { date: "desc" },
      take: 50,
    });

    // Filter by search query if provided
    if (q) {
      const query = q.toLowerCase();
      const filtered = sessions.filter(
        (s) =>
          s.summary.toLowerCase().includes(query) ||
          s.topic.name.toLowerCase().includes(query) ||
          s.questions.some(
            (q) =>
              q.questionText.toLowerCase().includes(query) ||
              q.feedback?.toLowerCase().includes(query)
          )
      );
      return NextResponse.json(filtered);
    }

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Get knowledge error:", error);
    return NextResponse.json({ error: "Failed to load knowledge base" }, { status: 500 });
  }
}
