import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOpenSession } from "@/lib/cash";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const userId = (session.user as any).id;

  const open = await getOpenSession(storeId);
  if (!open) return NextResponse.json({ error: "Nenhum caixa aberto" }, { status: 400 });

  const body = await req.json();
  const type = body.type === "suprimento" ? "suprimento" : "sangria";
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "Valor inválido" }, { status: 400 });

  const movement = await db.cashMovement.create({
    data: { sessionId: open.id, userId, type, amount, reason: body.reason ?? null },
  });

  return NextResponse.json(movement, { status: 201 });
}
