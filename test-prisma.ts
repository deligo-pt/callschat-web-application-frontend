import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function test() {
  try {
    const res = await db.conversation.findFirst({
      select: { id: true, disappearAfterSeconds: true }
    });
    console.log("Success:", res);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await db.$disconnect();
  }
}
test();
