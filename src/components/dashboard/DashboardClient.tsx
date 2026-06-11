"use client";
import { formatCurrency, formatPct, cn } from "@/lib/utils";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"];

function MetricCard({
  label, value, sub, icon, color = "orange",
}: {
  label: string; value: string; sub?: string; icon: string; color?: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

function CmvGauge({ pct, target }: { pct: number; target: number }) {
  const status = pct <= target ? "ok" : pct <= target * 1.15 ? "warning" : "danger";
  const colors = { ok: "#22c55e", warning: "#f59e0b", danger: "#ef4444" };
  const angle = Math.min((pct / (target * 2)) * 180, 180);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">CMV do Mês</p>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-12 overflow-hidden">
          <div className="absolute inset-0 rounded-t-full border-8 border-gray-100" />
          <div
            className="absolute inset-0 rounded-t-full border-8 origin-bottom transition-all duration-700"
            style={{
              borderColor: colors[status],
              transform: `rotate(${angle - 90}deg)`,
            }}
          />
        </div>
        <div>
          <p
            className="text-3xl font-bold"
            style={{ color: colors[status] }}
          >
            {formatPct(pct)}
          </p>
          <p className="text-xs text-gray-400">Meta: {formatPct(target)}</p>
          <span
            className={cn(
              "inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1",
              status === "ok" && "bg-green-100 text-green-700",
              status === "warning" && "bg-amber-100 text-amber-700",
              status === "danger" && "bg-red-100 text-red-700"
            )}
          >
            {status === "ok" ? "✅ Dentro da meta" : status === "warning" ? "⚠️ Atenção" : "🔴 Acima da meta"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function DashboardClient({ data }: { data: any }) {
  const { today, month, lowStockCount, cmvTarget, trend, topProducts } = data;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Alertas */}
      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-amber-800">
          ⚠️ <strong>{lowStockCount} insumo{lowStockCount > 1 ? "s" : ""}</strong> sem estoque
          <a href="/estoque" className="ml-auto text-amber-600 font-medium underline">Ver estoque</a>
        </div>
      )}

      {/* Cards hoje */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Hoje</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Faturamento" value={formatCurrency(today.revenue)} sub={`${today.count} vendas`} icon="💰" />
          <MetricCard label="CMV" value={formatPct(today.cmvPct)} sub={today.cmvPct <= cmvTarget ? "✅ ok" : "⚠️ alto"} icon="📊" />
          <MetricCard label="Ticket Médio" value={formatCurrency(today.avgTicket)} icon="🎟️" />
          <MetricCard label="Custo" value={formatCurrency(today.cost)} icon="📉" />
        </div>
      </div>

      {/* Cards mês */}
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Este mês</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Receita" value={formatCurrency(month.revenue)} sub={`${month.count} vendas`} icon="📈" />
          <MetricCard label="Lucro Bruto" value={formatCurrency(month.profit)} icon="💚" />
          <MetricCard label="Custo Total" value={formatCurrency(month.cost)} icon="💸" />
          <div className="col-span-1">
            <CmvGauge pct={month.cmvPct} target={cmvTarget} />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Linha: vendas 7 dias */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-4">Vendas — últimos 7 dias</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Line type="monotone" dataKey="receita" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pizza: mix de produtos */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-4">Mix de produtos (mês)</p>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={topProducts.map((p: any) => ({ name: p.name, value: p.revenue }))}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                  label={({ name, percent }) => `${(name ?? "").split(" ")[0]} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {topProducts.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">
              Nenhuma venda ainda
            </div>
          )}
        </div>
      </div>

      {/* Top produtos */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Top produtos do mês</p>
          <div className="space-y-2">
            {topProducts.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg w-6 text-center">{["🥇","🥈","🥉","4️⃣","5️⃣"][i]}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-800">{p.name}</span>
                    <span className="text-gray-600">{formatCurrency(p.revenue)}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                    <span>Margem: {formatPct(p.margin)}</span>
                    <span>CMV: {formatPct(p.pct)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
