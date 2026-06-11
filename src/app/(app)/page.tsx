import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, startOfMonth, formatCurrency, formatPct } from "@/lib/utils";
import { calcCmvPeriod, cmvByProduct } from "@/lib/cmv";
import DashboardClient from "@/components/dashboard/DashboardClient";

async function getDashboardData(storeId: string) {
  const now = new Date();
  const todayStart = startOfDay();
  const monthStart = startOfMonth();

  const [salesToday, salesMonth, lowStock, cmvToday, cmvMonth, cmvTrend, topProducts, store] =
    await Promise.all([
      db.sale.aggregate({
        where: { storeId, status: "concluida", createdAt: { gte: todayStart } },
        _sum: { totalAmount: true, totalCost: true },
        _count: true,
        _avg: { totalAmount: true },
      }),
      db.sale.aggregate({
        where: { storeId, status: "concluida", createdAt: { gte: monthStart } },
        _sum: { totalAmount: true, totalCost: true },
        _count: true,
      }),
      db.ingredient.count({
        where: { storeId, stockQty: { lte: 0 } },
      }),
      calcCmvPeriod(storeId, todayStart, now),
      calcCmvPeriod(storeId, monthStart, now),
      // Trend: últimos 7 dias
      Promise.all(
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          const from = new Date(d); from.setHours(0, 0, 0, 0);
          const to = new Date(d); to.setHours(23, 59, 59, 999);
          return db.sale.aggregate({
            where: { storeId, status: "concluida", createdAt: { gte: from, lte: to } },
            _sum: { totalAmount: true },
          }).then((r: { _sum: { totalAmount: number | null } }) => ({
            day: from.toLocaleDateString("pt-BR", { weekday: "short" }),
            receita: r._sum.totalAmount ?? 0,
          }));
        })
      ),
      cmvByProduct(storeId, monthStart, now),
      db.store.findUnique({ where: { id: storeId }, select: { cmvTarget: true, name: true } }),
    ]);

  return {
    today: {
      revenue: salesToday._sum.totalAmount ?? 0,
      cost: salesToday._sum.totalCost ?? 0,
      count: salesToday._count,
      avgTicket: salesToday._avg.totalAmount ?? 0,
      cmvPct: cmvToday.pct,
    },
    month: {
      revenue: salesMonth._sum.totalAmount ?? 0,
      cost: salesMonth._sum.totalCost ?? 0,
      count: salesMonth._count,
      cmvPct: cmvMonth.pct,
      profit: (salesMonth._sum.totalAmount ?? 0) - (salesMonth._sum.totalCost ?? 0),
    },
    lowStockCount: lowStock,
    cmvTarget: store?.cmvTarget ?? 30,
    storeName: store?.name ?? "Minha loja",
    trend: cmvTrend,
    topProducts: topProducts.slice(0, 5),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const storeId = (session?.user as any)?.storeId;

  if (!storeId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Nenhuma loja configurada. Contate o administrador.</p>
      </div>
    );
  }

  const data = await getDashboardData(storeId);

  return <DashboardClient data={data} />;
}
