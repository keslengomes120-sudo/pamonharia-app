"use client";
import { formatCurrency, formatPct, cn } from "@/lib/utils";
import {
  Banknote, Percent, Receipt, TrendingDown, TrendingUp, PiggyBank, Wallet,
  AlertTriangle, type LucideIcon,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { Card } from "@/components/ui/Card";

const COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"];

function MetricCard({
  label, value, sub, icon: Icon,
}: {
  label: string; value: string; sub?: string; icon: LucideIcon;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="text-xs text-subtle mt-0.5">{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary-soft-foreground flex items-center justify-center shrink-0">
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}

function CmvGauge({ pct, target }: { pct: number; target: number }) {
  const status = pct <= target ? "ok" : pct <= target * 1.15 ? "warning" : "danger";
  const colors = { ok: "#22c55e", warning: "#f59e0b", danger: "#ef4444" };
  const angle = Math.min((pct / (target * 2)) * 180, 180);

  return (
    <Card className="p-5">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-3">CMV do Mês</p>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-12 overflow-hidden">
          <div className="absolute inset-0 rounded-t-full border-8 border-border" />
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
          <p className="text-xs text-subtle">Meta: {formatPct(target)}</p>
          <span
            className={cn(
              "inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1",
              status === "ok" && "bg-success-soft text-success-foreground",
              status === "warning" && "bg-warning-soft text-warning-foreground",
              status === "danger" && "bg-danger-soft text-danger-foreground"
            )}
          >
            {status === "ok" ? "✅ Dentro da meta" : status === "warning" ? "⚠️ Atenção" : "🔴 Acima da meta"}
          </span>
        </div>
      </div>
    </Card>
  );
}

export default function DashboardClient({ data }: { data: any }) {
  const { today, month, lowStockCount, cmvTarget, trend, topProducts } = data;

  return (
    <div className="p-4 md:p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-subtle">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Alertas */}
      {lowStockCount > 0 && (
        <div className="bg-warning-soft border border-warning/40 rounded-xl px-4 py-3 flex items-center gap-2 text-sm text-warning-foreground">
          <AlertTriangle size={16} className="shrink-0" />
          <span><strong>{lowStockCount} insumo{lowStockCount > 1 ? "s" : ""}</strong> sem estoque</span>
          <a href="/estoque" className="ml-auto text-warning font-medium underline">Ver estoque</a>
        </div>
      )}

      {/* Cards hoje */}
      <div>
        <p className="text-xs text-subtle uppercase tracking-wide font-medium mb-2">Hoje</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Faturamento" value={formatCurrency(today.revenue)} sub={`${today.count} vendas`} icon={Banknote} />
          <MetricCard label="CMV" value={formatPct(today.cmvPct)} sub={today.cmvPct <= cmvTarget ? "dentro da meta" : "acima da meta"} icon={Percent} />
          <MetricCard label="Ticket Médio" value={formatCurrency(today.avgTicket)} icon={Receipt} />
          <MetricCard label="Custo" value={formatCurrency(today.cost)} icon={TrendingDown} />
        </div>
      </div>

      {/* Cards mês */}
      <div>
        <p className="text-xs text-subtle uppercase tracking-wide font-medium mb-2">Este mês</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="Receita" value={formatCurrency(month.revenue)} sub={`${month.count} vendas`} icon={TrendingUp} />
          <MetricCard label="Lucro Bruto" value={formatCurrency(month.profit)} icon={PiggyBank} />
          <MetricCard label="Custo Total" value={formatCurrency(month.cost)} icon={Wallet} />
          <div className="col-span-1">
            <CmvGauge pct={month.cmvPct} target={cmvTarget} />
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Linha: vendas 7 dias */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Vendas — últimos 7 dias</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} stroke="var(--border)" />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} stroke="var(--border)" tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v))}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }}
              />
              <Line type="monotone" dataKey="receita" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Pizza: mix de produtos */}
        <Card className="p-5">
          <p className="text-sm font-semibold text-foreground mb-4">Mix de produtos (mês)</p>
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
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-subtle text-sm">
              Nenhuma venda ainda
            </div>
          )}
        </Card>
      </div>

      {/* Top produtos */}
      {topProducts.length > 0 && (
        <Card className="p-5">
          <p className="text-sm font-semibold text-foreground mb-3">Top produtos do mês</p>
          <div className="space-y-2">
            {topProducts.map((p: any, i: number) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg w-6 text-center">{["🥇","🥈","🥉","4️⃣","5️⃣"][i]}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-foreground">{p.name}</span>
                    <span className="text-muted-foreground">{formatCurrency(p.revenue)}</span>
                  </div>
                  <div className="flex gap-3 text-xs text-subtle mt-0.5">
                    <span>Margem: {formatPct(p.margin)}</span>
                    <span>CMV: {formatPct(p.pct)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
