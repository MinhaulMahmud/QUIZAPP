export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("@/lib/scheduler");
    await startScheduler();

    const { launchBot } = await import("@/bot");
    launchBot().catch((err) => console.error("Bot auto-launch error:", err));
  }
}
