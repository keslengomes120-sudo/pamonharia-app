import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOpenSession } from "@/lib/cash";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const open = await getOpenSession(storeId);

  if (!open) return NextResponse.json({ session: null });

  const [movements, salesCount] = await Promise.all([
    db.cashMovement.findMany({
      where: { sessionId: open.id },
      orderBy: { createdAt: "desc" },
    }),
    db.sale.count({ where: { cashSessionId: open.id, status: "concluida" } }),
  ]);

  return NextResponse.json({ session: open, movements, salesCount });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const userId = (session.user as any).id;

  const existing = await getOpenSession(storeId);
  if (existing) return NextResponse.json({ error: "Já existe um caixa aberto" }, { status: 409 });

  const body = await req.json();
  const created = await db.cashSession.create({
    data: { storeId, userId, openingAmount: body.openingAmount ?? 0 },
  });

  return NextResponse.json(created, { status: 201 });
}
