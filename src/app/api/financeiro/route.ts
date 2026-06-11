import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function periodDates(period: string): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  if (period === "today") {
    from.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    from.setDate(from.getDate() - 6);
    from.setHours(0, 0, 0, 0);
  } else if (period === "month") {
    from.setDate(1);
    from.setHours(0, 0, 0, 0);
  } else if (period === "year") {
    from.setMonth(0, 1);
    from.setHours(0, 0, 0, 0);
  }
  return { from, to };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "month";
  const { from, to } = periodDates(period);

  const [sales, expenses, saleItems] = await Promise.all([
    db.sale.findMany({
      where: { storeId, status: "concluida", createdAt: { gte: from, lte: to } },
      select: { totalAmount: true, totalCost: true, cmvPct: true, paymentMethod: true, createdAt: true },
    }),
    db.expense.findMany({
      where: { storeId, date: { gte: from.toISOString().split("T")[0], lte: to.toISOString().split("T")[0] } },
      select: { amount: true, category: true, description: true, date: true },
    }),
    db.saleItem.findMany({
      where: {
        sale: { storeId, status: "concluida", createdAt: { gte: from, lte: to } },
      },
      include: { product: { select: { name: true } } },
    }),
  ]);

  const revenue = sales.reduce((s, v) => s + v.totalAmount, 0);
  const cost = sales.reduce((s, v) => s + v.totalCost, 0);
  const profit = revenue - cost;
  const cmvPct = revenue ? (cost / revenue) * 100 : 0;
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = profit - totalExpenses;

  // Agrupamento por produto
  const productMap: Record<string, { name: string; revenue: number; cost: number; qty: number }> = {};
  for (const item of saleItems) {
    if (!productMap[item.productId]) {
      productMap[item.productId] = { name: item.product.name, revenue: 0, cost: 0, qty: 0 };
    }
    productMap[item.productId].revenue += item.subtotal;
    productMap[item.productId].cost += item.costTotal;
    productMap[item.productId].qty += item.qty;
  }
  const byProduct = Object.values(productMap)
    .map((p) => ({
      ...p,
      margin: p.revenue ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
      cmvPct: p.revenue ? (p.cost / p.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Agrupamento por método de pagamento
  const payMap: Record<string, number> = {};
  for (const s of sales) {
    payMap[s.paymentMethod] = (payMap[s.paymentMethod] ?? 0) + s.totalAmount;
  }
  const byPayment = Object.entries(payMap).map(([method, total]) => ({ method, total }));

  // Despesas por categoria
  const expMap: Record<string, number> = {};
  for (const e of expenses) {
    expMap[e.category] = (expMap[e.category] ?? 0) + e.amount;
  }
  const byExpenseCategory = Object.entries(expMap).map(([category, total]) => ({ category, total }));

  return NextResponse.json({
    summary: { revenue, cost, profit, cmvPct, totalExpenses, netProfit, salesCount: sales.length },
    byProduct,
    byPayment,
    byExpenseCategory,
    expenses,
  });
}
