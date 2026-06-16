import { defineConfig } from "@prisma/config";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Manually load .env because Prisma's auto-load doesn't work on Termux/Android
const envPath = resolve(".env");
if (existsSync(envPath) && !process.env.DATABASE_URL) {
  const env = readFileSync(envPath, "utf-8");
  for (const line of env.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "",
  },
});
