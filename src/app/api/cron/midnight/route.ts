import { NextResponse } from "next/server";
import { runMidnightCron } from "@/bot/cron/midnight";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runMidnightCron();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Midnight cron error:", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
