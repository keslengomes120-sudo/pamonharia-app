import { db } from "@/lib/db";

export async function calcCmvPeriod(
  storeId: string,
  from: Date,
  to: Date
): Promise<{ revenue: number; cost: number; pct: number }> {
  const sales = await db.sale.findMany({
    where: {
      storeId,
      status: "concluida",
      createdAt: { gte: from, lte: to },
    },
  });
  const revenue = sales.reduce((s, v) => s + v.totalAmount, 0);
  const cost = sales.reduce((s, v) => s + v.totalCost, 0);
  return { revenue, cost, pct: revenue ? (cost / revenue) * 100 : 0 };
}

export async function cmvByProduct(storeId: string, from: Date, to: Date) {
  const items = await db.saleItem.findMany({
    where: {
      sale: {
        storeId,
        status: "concluida",
        createdAt: { gte: from, lte: to },
      },
    },
    include: { product: true },
  });

  const map: Record<
    string,
    { name: string; revenue: number; cost: number; qty: number }
  > = {};

  for (const item of items) {
    if (!map[item.productId]) {
      map[item.productId] = {
        name: item.product.name,
        revenue: 0,
        cost: 0,
        qty: 0,
      };
    }
    map[item.productId].revenue += item.subtotal;
    map[item.productId].cost += item.costTotal;
    map[item.productId].qty += item.qty;
  }

  return Object.values(map).map((p) => ({
    ...p,
    pct: p.revenue ? (p.cost / p.revenue) * 100 : 0,
    margin: p.revenue ? ((p.revenue - p.cost) / p.revenue) * 100 : 0,
  }));
}
