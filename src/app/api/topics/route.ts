import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const topics = await prisma.topic.findMany({
    where: { adminId: session.adminId },
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, difficulty: true, active: true, description: true },
  });

  return NextResponse.json(topics);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, difficulty } = await request.json();
    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const topic = await prisma.topic.create({
      data: {
        adminId: session.adminId,
        name: name.trim(),
        description: description || "",
        difficulty: difficulty || "beginner",
      },
    });

    return NextResponse.json(topic, { status: 201 });
  } catch (error) {
    console.error("Create topic error:", error);
    return NextResponse.json({ error: "Failed to create topic" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, name, difficulty, active, description } = await request.json();
    const topic = await prisma.topic.findFirst({
      where: { id, adminId: session.adminId },
    });
    if (!topic) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.topic.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(difficulty !== undefined && { difficulty }),
        ...(active !== undefined && { active }),
        ...(description !== undefined && { description }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update topic error:", error);
    return NextResponse.json({ error: "Failed to update topic" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();
    const topic = await prisma.topic.findFirst({
      where: { id, adminId: session.adminId },
    });
    if (!topic) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.topic.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete topic error:", error);
    return NextResponse.json({ error: "Failed to delete topic" }, { status: 500 });
  }
}
