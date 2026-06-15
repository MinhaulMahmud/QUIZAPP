import { prisma } from "./prisma";
import { encrypt, decrypt } from "./crypto";

const SENSITIVE_KEYS = ["telegram_bot_token", "openrouter_api_key"];

export async function getSetting(key: string): Promise<string | null> {
  const setting = await prisma.setting.findUnique({ where: { key } });
  if (!setting) return null;
  if (SENSITIVE_KEYS.includes(key)) {
    return decrypt(setting.value);
  }
  return setting.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const finalValue = SENSITIVE_KEYS.includes(key) ? encrypt(value) : value;
  await prisma.setting.upsert({
    where: { key },
    update: { value: finalValue },
    create: { key, value: finalValue },
  });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const settings = await prisma.setting.findMany();
  const result: Record<string, string> = {};
  for (const s of settings) {
    if (SENSITIVE_KEYS.includes(s.key)) {
      try {
        result[s.key] = decrypt(s.value);
      } catch {
        result[s.key] = "[decryption error]";
      }
    } else {
      result[s.key] = s.value;
    }
  }
  return result;
}
