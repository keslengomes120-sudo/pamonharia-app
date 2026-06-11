"use client";
import { useEffect, useState } from "react";
import { formatCurrency, formatPct } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Summary = {
  revenue: number; cost: number; profit: number; cmvPct: number;
  totalExpenses: number; netProfit: number; salesCount: number;
};
type ProductRow = { name: string; revenue: number; cost: number; qty: number; margin: number; cmvPct: number };
type PayRow = { method: string; total: number };

const PERIODS = [
  { id: "today", label: "Hoje" },
  { id: "week", label: "7 dias" },
  { id: "month", label: "Este mês" },
  { id: "year", label: "Este ano" },
];

const PAY_LABELS: Record<string, string> = {
  dinheiro: "💵 Dinheiro", pix: "📱 PIX",
  debito: "💳 Débito", credito: "💳 Crédito",
};

export default function FinanceiroPage() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<{ summary: Summary; byProduct: ProductRow[]; byPayment: PayRow[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/financeiro?period=${period}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, [period]);

  const s = data?.summary;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">💵 Financeiro</h1>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p.id ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : s ? (
        <>
          {/* Cards resumo */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { label: "Faturamento", value: formatCurrency(s.revenue), sub: `${s.salesCount} vendas`, color: "green" },
              { label: "Custo produtos", value: formatCurrency(s.cost), sub: `CMV ${formatPct(s.cmvPct)}`, color: s.cmvPct <= 30 ? "green" : "red" },
              { label: "Lucro bruto", value: formatCurrency(s.profit), sub: formatPct(s.revenue ? (s.profit / s.revenue) * 100 : 0), color: "blue" },
              { label: "Despesas", value: formatCurrency(s.totalExpenses), color: "amber" },
              { label: "Lucro líquido", value: formatCurrency(s.netProfit), color: s.netProfit >= 0 ? "green" : "red" },
              { label: "CMV%", value: formatPct(s.cmvPct), sub: s.cmvPct <= 30 ? "✅ Dentro da meta" : "⚠️ Acima de 30%", color: s.cmvPct <= 30 ? "green" : "red" },
            ].map((card) => (
              <div key={card.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
                <p className={`text-xl font-bold mt-1 ${
                  card.color === "green" ? "text-green-700" :
                  card.color === "red" ? "text-red-600" :
                  card.color === "amber" ? "text-amber-600" : "text-blue-700"
                }`}>{card.value}</p>
                {card.sub && <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>}
              </div>
            ))}
          </div>

          {/* Gráfico por produto */}
          {data!.byProduct.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-4">Receita por produto</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data!.byProduct.slice(0, 8)} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                  <Bar dataKey="revenue" fill="#f97316" radius={[0, 4, 4, 0]} name="Receita" />
                  <Bar dataKey="cost" fill="#fed7aa" radius={[0, 4, 4, 0]} name="Custo" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Tabela por produto */}
          {data!.byProduct.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-700">Custo de produção por produto</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {["Produto", "Qtd", "Receita", "Custo", "CMV%", "Margem"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data!.byProduct.map((p) => (
                      <tr key={p.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                        <td className="px-4 py-3 text-gray-600">{p.qty}</td>
                        <td className="px-4 py-3 text-green-700 font-medium">{formatCurrency(p.revenue)}</td>
                        <td className="px-4 py-3 text-gray-600">{formatCurrency(p.cost)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.cmvPct <= 30 ? "bg-green-100 text-green-700" :
                            p.cmvPct <= 40 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                          }`}>{formatPct(p.cmvPct)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${p.margin >= 50 ? "text-green-700" : p.margin >= 20 ? "text-amber-600" : "text-red-600"}`}>
                            {formatPct(p.margin)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagamentos */}
          {data!.byPayment.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <p className="text-sm font-semibold text-gray-700 mb-3">Formas de pagamento</p>
              <div className="space-y-2">
                {data!.byPayment.sort((a, b) => b.total - a.total).map((p) => (
                  <div key={p.method} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{PAY_LABELS[p.method] ?? p.method}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-orange-400 h-1.5 rounded-full"
                          style={{ width: `${s.revenue ? (p.total / s.revenue) * 100 : 0}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-800 w-20 text-right">{formatCurrency(p.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {s.salesCount === 0 && (
            <div className="text-center py-16 text-gray-300">
              <p className="text-4xl mb-2">📊</p>
              <p>Nenhuma venda neste período</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
