import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getSetting, setSetting, getAllSettings } from "@/lib/settings";
import { resetClient } from "@/lib/ai";
import { startScheduler } from "@/lib/scheduler";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getAllSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key, value } = await request.json();
    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    await setSetting(key, value);

    if (key === "openrouter_api_key" || key === "ollama_base_url") {
      resetClient();
    }

    if (key === "quiz_time") {
      startScheduler().catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set setting error:", error);
    return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
  }
}
