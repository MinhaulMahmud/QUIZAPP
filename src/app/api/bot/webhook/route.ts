import { NextResponse } from "next/server";
import { getBot, setupBotHandlers } from "@/bot";

export async function POST(request: Request) {
  try {
    const bot = await getBot();
    if (!bot) {
      return NextResponse.json(
        { error: "Bot not configured" },
        { status: 400 }
      );
    }

    setupBotHandlers(bot);

    // Handle the update
    const rawBody = await request.text();
    const update = JSON.parse(rawBody);

    await bot.handleUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
