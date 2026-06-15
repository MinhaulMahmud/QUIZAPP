import { schedule } from "node-cron";
import type { ScheduledTask } from "node-cron";
import { getSetting } from "./settings";
import { runMorningCron } from "@/bot/cron/morning";
import { runMidnightCron } from "@/bot/cron/midnight";

let morningTask: ScheduledTask | null = null;
let midnightTask: ScheduledTask | null = null;

function parseTimeToCron(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "0 8 * * *";
  return `${minutes} ${hours} * * *`;
}

function hourToCron(hours: number, minutes = 0): string {
  return `${minutes} ${hours} * * *`;
}

export async function startScheduler(): Promise<void> {
  stopScheduler();

  const quizTime =
    (await getSetting("quiz_time")) || process.env.QUIZ_TIME || "08:00";

  const morningCronExpr = parseTimeToCron(quizTime);
  const midnightCronExpr = hourToCron(0, 0);

  console.log(
    `Scheduler: Morning cron scheduled for ${quizTime} (${morningCronExpr})`
  );
  console.log(
    `Scheduler: Midnight cron scheduled for 00:00 (${midnightCronExpr})`
  );

  morningTask = schedule(morningCronExpr, async () => {
    console.log("Scheduler: Running morning cron...");
    try {
      await runMorningCron();
      console.log("Scheduler: Morning cron completed");
    } catch (error) {
      console.error("Scheduler: Morning cron failed:", error);
    }
  });

  midnightTask = schedule(midnightCronExpr, async () => {
    console.log("Scheduler: Running midnight cron...");
    try {
      await runMidnightCron();
      console.log("Scheduler: Midnight cron completed");
    } catch (error) {
      console.error("Scheduler: Midnight cron failed:", error);
    }
  });
}

export function stopScheduler(): void {
  if (morningTask) {
    morningTask.stop();
    morningTask = null;
  }
  if (midnightTask) {
    midnightTask.stop();
    midnightTask = null;
  }
}
