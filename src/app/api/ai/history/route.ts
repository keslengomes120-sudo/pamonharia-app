import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;

  const chats = await db.aiChat.findMany({
    where: { storeId },
    orderBy: { createdAt: "asc" },
    take: 30,
    select: { message: true, response: true, createdAt: true },
  });

  // Expand each record into two messages (user + assistant)
  const messages = chats.flatMap((c) => [
    { role: "user", content: c.message, createdAt: c.createdAt },
    { role: "assistant", content: c.response, createdAt: c.createdAt },
  ]);

  return NextResponse.json(messages);
}
