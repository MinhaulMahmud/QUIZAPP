import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
try {
  const admins = await p.admin.findMany();
  console.log(JSON.stringify(admins));
} catch (e) {
  console.error(e.message);
} finally {
  await p.$disconnect();
}
