"use client";
import { useEffect, useState } from "react";
import { formatCurrency, formatPct, cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

type CmvData = {
  period: { revenue: number; cost: number; pct: number };
  byProduct: { name: string; revenue: number; cost: number; margin: number; pct: number; qty: number }[];
  target: number;
};

type Period = "today" | "week" | "month";

export default function CmvPage() {
  const [data, setData] = useState<CmvData | null>(null);
  const [period, setPeriod] = useState<Period>("month");
  const [whatIfPrice, setWhatIfPrice] = useState("");
  const [whatIfCost, setWhatIfCost] = useState("");

  useEffect(() => { load(); }, [period]);

  async function load() {
    const r = await fetch(`/api/cmv?period=${period}`).then((r) => r.json());
    setData(r);
  }

  const whatIfCmv = whatIfPrice && whatIfCost
    ? (Number(whatIfCost) / Number(whatIfPrice)) * 100
    : null;

  if (!data) return <div className="p-6 text-subtle">Carregando...</div>;

  const { period: p, byProduct, target } = data;
  const cmvStatus = p.pct <= target ? "ok" : p.pct <= target * 1.15 ? "warning" : "danger";
  const statusColors = { ok: "text-success bg-success-soft", warning: "text-warning bg-warning-soft", danger: "text-danger bg-danger-soft" };
  const barColors = byProduct.map((b) => b.pct <= target ? "#22c55e" : b.pct <= target * 1.15 ? "#f59e0b" : "#ef4444");

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">📊 CMV</h1>
        <div className="flex gap-1 bg-muted p-1 rounded-xl">
          {(["today", "week", "month"] as Period[]).map((v) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                period === v ? "bg-card shadow text-foreground" : "text-muted-foreground"
              )}>
              {v === "today" ? "Hoje" : v === "week" ? "7 dias" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground uppercase">Receita</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(p.revenue)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground uppercase">Custo</p>
          <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(p.cost)}</p>
        </div>
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">
          <p className="text-xs text-muted-foreground uppercase">Lucro Bruto</p>
          <p className="text-2xl font-bold text-success mt-1">{formatCurrency(p.revenue - p.cost)}</p>
        </div>
        <div className={cn("rounded-2xl p-4 shadow-sm border border-border bg-card")}>
          <p className="text-xs text-muted-foreground uppercase">CMV%</p>
          <p className={cn("text-2xl font-bold mt-1", cmvStatus === "ok" ? "text-success" : cmvStatus === "warning" ? "text-warning" : "text-danger")}>
            {formatPct(p.pct)}
          </p>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColors[cmvStatus])}>
            Meta: {formatPct(target)}
          </span>
        </div>
      </div>

      {/* Gráfico CMV por produto */}
      {byProduct.length > 0 && (
        <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
          <p className="text-sm font-semibold text-foreground mb-4">CMV por produto (%)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byProduct} margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(v) => v.split(" ")[0]} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
              <ReferenceLine y={target} stroke="#f97316" strokeDasharray="4 4" label={{ value: `Meta ${target}%`, fontSize: 10, fill: "#f97316" }} />
              <Bar dataKey="pct" radius={[6, 6, 0, 0]}>
                {byProduct.map((_, i) => (
                  <rect key={i} fill={barColors[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela por produto */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <p className="text-sm font-semibold text-foreground">Detalhamento por produto</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["Produto", "Receita", "Custo", "Margem", "CMV%", "Qtd"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byProduct.map((row, i) => (
                <tr key={i} className="hover:bg-muted">
                  <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                  <td className="px-4 py-3 text-foreground">{formatCurrency(row.revenue)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatCurrency(row.cost)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      row.margin >= 50 ? "bg-success-soft text-success-foreground" :
                      row.margin >= 20 ? "bg-warning-soft text-warning-foreground" : "bg-danger-soft text-danger-foreground"
                    )}>{formatPct(row.margin)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      row.pct <= target ? "bg-success-soft text-success-foreground" :
                      row.pct <= target * 1.15 ? "bg-warning-soft text-warning-foreground" : "bg-danger-soft text-danger-foreground"
                    )}>{formatPct(row.pct)}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.qty}</td>
                </tr>
              ))}
              {byProduct.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-subtle">Nenhuma venda no período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulador "e se?" */}
      <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
        <p className="text-sm font-semibold text-foreground mb-3">🧮 Simulador de CMV</p>
        <p className="text-xs text-subtle mb-3">Simule o CMV de um produto ou ajuste de preço</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">Preço de venda (R$)</label>
            <input type="number" step="0.01" value={whatIfPrice} onChange={(e) => setWhatIfPrice(e.target.value)}
              placeholder="Ex: 8.00"
              className="w-full mt-1 px-3 py-2 border border-border rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Custo (R$)</label>
            <input type="number" step="0.01" value={whatIfCost} onChange={(e) => setWhatIfCost(e.target.value)}
              placeholder="Ex: 2.50"
              className="w-full mt-1 px-3 py-2 border border-border rounded-xl text-sm" />
          </div>
        </div>
        {whatIfCmv !== null && (
          <div className={cn("mt-3 rounded-xl px-4 py-3 text-sm font-semibold",
            whatIfCmv <= target ? "bg-success-soft text-success-foreground" :
            whatIfCmv <= target * 1.15 ? "bg-warning-soft text-warning-foreground" : "bg-danger-soft text-danger-foreground"
          )}>
            CMV: {whatIfCmv.toFixed(1)}% — Margem: {(100 - whatIfCmv).toFixed(1)}%
            {whatIfCmv <= target ? " ✅ Dentro da meta" : " ⚠️ Acima da meta"}
          </div>
        )}
      </div>
    </div>
  );
}
