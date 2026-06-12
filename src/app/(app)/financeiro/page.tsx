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
        <h1 className="text-xl font-bold text-foreground">💵 Financeiro</h1>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button key={p.id} onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                period === p.id ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-muted"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-subtle">Carregando...</div>
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
              <div key={card.label} className="bg-card rounded-2xl p-4 shadow-sm border border-border">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">{card.label}</p>
                <p className={`text-xl font-bold mt-1 ${
                  card.color === "green" ? "text-success-foreground" :
                  card.color === "red" ? "text-danger" :
                  card.color === "amber" ? "text-warning" : "text-blue-700"
                }`}>{card.value}</p>
                {card.sub && <p className="text-xs text-subtle mt-0.5">{card.sub}</p>}
              </div>
            ))}
          </div>

          {/* Gráfico por produto */}
          {data!.byProduct.length > 0 && (
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
              <p className="text-sm font-semibold text-foreground mb-4">Receita por produto</p>
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
            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
              <div className="px-5 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Custo de produção por produto</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      {["Produto", "Qtd", "Receita", "Custo", "CMV%", "Margem"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data!.byProduct.map((p) => (
                      <tr key={p.name} className="hover:bg-muted">
                        <td className="px-4 py-3 font-medium text-foreground">{p.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.qty}</td>
                        <td className="px-4 py-3 text-success-foreground font-medium">{formatCurrency(p.revenue)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatCurrency(p.cost)}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            p.cmvPct <= 30 ? "bg-success-soft text-success-foreground" :
                            p.cmvPct <= 40 ? "bg-warning-soft text-warning-foreground" : "bg-danger-soft text-danger-foreground"
                          }`}>{formatPct(p.cmvPct)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium ${p.margin >= 50 ? "text-success-foreground" : p.margin >= 20 ? "text-warning" : "text-danger"}`}>
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
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border">
              <p className="text-sm font-semibold text-foreground mb-3">Formas de pagamento</p>
              <div className="space-y-2">
                {data!.byPayment.sort((a, b) => b.total - a.total).map((p) => (
                  <div key={p.method} className="flex justify-between items-center">
                    <span className="text-sm text-foreground">{PAY_LABELS[p.method] ?? p.method}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-muted rounded-full h-1.5">
                        <div className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${s.revenue ? (p.total / s.revenue) * 100 : 0}%` }} />
                      </div>
                      <span className="text-sm font-medium text-foreground w-20 text-right">{formatCurrency(p.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {s.salesCount === 0 && (
            <div className="text-center py-16 text-subtle">
              <p className="text-4xl mb-2">📊</p>
              <p>Nenhuma venda neste período</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
