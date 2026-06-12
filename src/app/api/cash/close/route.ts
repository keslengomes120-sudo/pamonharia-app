import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOpenSession, computeExpected } from "@/lib/cash";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const open = await getOpenSession(storeId);
  if (!open) return NextResponse.json({ error: "Nenhum caixa aberto" }, { status: 400 });

  const body = await req.json();
  const counted = {
    cash: Number(body.countedCash) || 0,
    pix: Number(body.countedPix) || 0,
    debit: Number(body.countedDebit) || 0,
    credit: Number(body.countedCredit) || 0,
  };

  const expected = await computeExpected(open.id, open.openingAmount);

  await db.cashSession.update({
    where: { id: open.id },
    data: {
      status: "fechada",
      closedAt: new Date(),
      countedCash: counted.cash,
      countedPix: counted.pix,
      countedDebit: counted.debit,
      countedCredit: counted.credit,
      notes: body.notes ?? null,
    },
  });

  const methods = [
    { key: "cash", label: "Dinheiro", expected: expected.cash, counted: counted.cash },
    { key: "pix", label: "PIX", expected: expected.pix, counted: counted.pix },
    { key: "debit", label: "Débito", expected: expected.debit, counted: counted.debit },
    { key: "credit", label: "Crédito", expected: expected.credit, counted: counted.credit },
  ].map((m) => ({ ...m, diff: m.counted - m.expected }));

  const totalDiff = methods.reduce((s, m) => s + m.diff, 0);

  return NextResponse.json({ methods, totalDiff, expected });
}
