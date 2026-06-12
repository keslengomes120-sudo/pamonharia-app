import { db } from "@/lib/db";

export type CashExpected = {
  cash: number;
  pix: number;
  debit: number;
  credit: number;
  sangrias: number;
  suprimentos: number;
};

export async function getOpenSession(storeId: string) {
  return db.cashSession.findFirst({
    where: { storeId, status: "aberta" },
    orderBy: { openedAt: "desc" },
  });
}

/** Calcula o valor esperado por método de pagamento na sessão. */
export async function computeExpected(sessionId: string, openingAmount: number): Promise<CashExpected> {
  const [sales, movements] = await Promise.all([
    db.sale.findMany({
      where: { cashSessionId: sessionId, status: "concluida" },
      select: { paymentMethod: true, totalAmount: true },
    }),
    db.cashMovement.findMany({
      where: { sessionId },
      select: { type: true, amount: true },
    }),
  ]);

  const byMethod = { dinheiro: 0, pix: 0, debito: 0, credito: 0 };
  for (const s of sales) {
    if (s.paymentMethod in byMethod) {
      byMethod[s.paymentMethod as keyof typeof byMethod] += s.totalAmount;
    }
  }

  let sangrias = 0;
  let suprimentos = 0;
  for (const m of movements) {
    if (m.type === "sangria") sangrias += m.amount;
    else if (m.type === "suprimento") suprimentos += m.amount;
  }

  return {
    cash: openingAmount + byMethod.dinheiro + suprimentos - sangrias,
    pix: byMethod.pix,
    debit: byMethod.debito,
    credit: byMethod.credito,
    sangrias,
    suprimentos,
  };
}
