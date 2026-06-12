import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const comandas = await db.comanda.findMany({
    where: { storeId, status: "aberta" },
    include: {
      customer: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  const withTotal = comandas.map((c) => ({
    ...c,
    total: c.items.reduce((s, i) => s + i.unitPrice * i.qty, 0),
  }));

  return NextResponse.json(withTotal);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const userId = (session.user as any).id;
  const body = await req.json();

  if (!body.label?.trim()) return NextResponse.json({ error: "Identificação obrigatória" }, { status: 400 });

  const comanda = await db.comanda.create({
    data: {
      storeId,
      userId,
      label: body.label.trim(),
      customerId: body.customerId ?? null,
    },
  });

  return NextResponse.json(comanda, { status: 201 });
}
