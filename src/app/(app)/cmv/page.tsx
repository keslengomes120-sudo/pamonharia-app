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

  if (!data) return <div className="p-6 text-gray-400">Carregando...</div>;

  const { period: p, byProduct, target } = data;
  const cmvStatus = p.pct <= target ? "ok" : p.pct <= target * 1.15 ? "warning" : "danger";
  const statusColors = { ok: "text-green-600 bg-green-100", warning: "text-amber-600 bg-amber-100", danger: "text-red-600 bg-red-100" };
  const barColors = byProduct.map((b) => b.pct <= target ? "#22c55e" : b.pct <= target * 1.15 ? "#f59e0b" : "#ef4444");

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">📊 CMV</h1>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {(["today", "week", "month"] as Period[]).map((v) => (
            <button key={v} onClick={() => setPeriod(v)}
              className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                period === v ? "bg-white shadow text-gray-900" : "text-gray-500"
              )}>
              {v === "today" ? "Hoje" : v === "week" ? "7 dias" : "Mês"}
            </button>
          ))}
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Receita</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(p.revenue)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Custo</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(p.cost)}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Lucro Bruto</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(p.revenue - p.cost)}</p>
        </div>
        <div className={cn("rounded-2xl p-4 shadow-sm border border-gray-100 bg-white")}>
          <p className="text-xs text-gray-500 uppercase">CMV%</p>
          <p className={cn("text-2xl font-bold mt-1", cmvStatus === "ok" ? "text-green-600" : cmvStatus === "warning" ? "text-amber-600" : "text-red-600")}>
            {formatPct(p.pct)}
          </p>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColors[cmvStatus])}>
            Meta: {formatPct(target)}
          </span>
        </div>
      </div>

      {/* Gráfico CMV por produto */}
      {byProduct.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-4">CMV por produto (%)</p>
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50">
          <p className="text-sm font-semibold text-gray-700">Detalhamento por produto</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Produto", "Receita", "Custo", "Margem", "CMV%", "Qtd"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {byProduct.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(row.revenue)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatCurrency(row.cost)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      row.margin >= 50 ? "bg-green-100 text-green-700" :
                      row.margin >= 20 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    )}>{formatPct(row.margin)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      row.pct <= target ? "bg-green-100 text-green-700" :
                      row.pct <= target * 1.15 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    )}>{formatPct(row.pct)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{row.qty}</td>
                </tr>
              ))}
              {byProduct.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-gray-300">Nenhuma venda no período</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulador "e se?" */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-gray-700 mb-3">🧮 Simulador de CMV</p>
        <p className="text-xs text-gray-400 mb-3">Simule o CMV de um produto ou ajuste de preço</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Preço de venda (R$)</label>
            <input type="number" step="0.01" value={whatIfPrice} onChange={(e) => setWhatIfPrice(e.target.value)}
              placeholder="Ex: 8.00"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Custo (R$)</label>
            <input type="number" step="0.01" value={whatIfCost} onChange={(e) => setWhatIfCost(e.target.value)}
              placeholder="Ex: 2.50"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm" />
          </div>
        </div>
        {whatIfCmv !== null && (
          <div className={cn("mt-3 rounded-xl px-4 py-3 text-sm font-semibold",
            whatIfCmv <= target ? "bg-green-50 text-green-700" :
            whatIfCmv <= target * 1.15 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
          )}>
            CMV: {whatIfCmv.toFixed(1)}% — Margem: {(100 - whatIfCmv).toFixed(1)}%
            {whatIfCmv <= target ? " ✅ Dentro da meta" : " ⚠️ Acima da meta"}
          </div>
        )}
      </div>
    </div>
  );
}
