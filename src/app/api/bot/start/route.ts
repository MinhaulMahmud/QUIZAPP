import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { launchBot } from "@/bot";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getSetting("telegram_bot_token");
    if (!token) {
      return NextResponse.json(
        { error: "Telegram bot token not configured" },
        { status: 400 }
      );
    }

    // Validate token by testing Telegram API
    const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const data = await res.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: "Invalid Telegram bot token" },
        { status: 400 }
      );
    }

    // Try to set webhook, fall back to polling for local dev
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    let webhookResult = null;

    if (!appUrl.includes("localhost")) {
      const webhookRes = await fetch(
        `https://api.telegram.org/bot${token}/setWebhook?url=${appUrl}/api/bot/webhook`
      );
      webhookResult = await webhookRes.json();
    }

    // Start polling for local dev (handles commands interactively)
    launchBot().catch(console.error);

    return NextResponse.json({
      success: true,
      bot: data.result,
      webhook: webhookResult,
      mode: appUrl.includes("localhost") ? "polling" : "webhook",
    });
  } catch (error) {
    console.error("Bot start error:", error);
    return NextResponse.json(
      { error: "Failed to start bot" },
      { status: 500 }
    );
  }
}
