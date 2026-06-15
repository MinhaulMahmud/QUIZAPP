import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
    select: { id: true, email: true },
  });

  if (!admin) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const topicCount = await prisma.topic.count({
    where: { adminId: admin.id },
  });

  const setupComplete =
    topicCount > 0 ||
    (await prisma.setting.findFirst({ where: { key: "setup_complete" } }));

  return NextResponse.json({
    ...admin,
    setupComplete: !!setupComplete,
  });
}
