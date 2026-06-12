"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCurrency, formatDateTime, cn } from "@/lib/utils";

type Movement = { id: string; type: string; amount: number; reason: string | null; createdAt: string };
type Session = { id: string; openingAmount: number; openedAt: string; userId: string };
type CloseMethod = { key: string; label: string; expected: number; counted: number; diff: number };

const COUNT_FIELDS = [
  { key: "countedCash", label: "💵 Dinheiro" },
  { key: "countedPix", label: "📱 PIX" },
  { key: "countedDebit", label: "💳 Débito" },
  { key: "countedCredit", label: "💳 Crédito" },
] as const;

export default function CaixaPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [salesCount, setSalesCount] = useState(0);
  const [openingAmount, setOpeningAmount] = useState("");
  const [busy, setBusy] = useState(false);

  const [movModal, setMovModal] = useState<null | "sangria" | "suprimento">(null);
  const [movAmount, setMovAmount] = useState("");
  const [movReason, setMovReason] = useState("");

  const [closeModal, setCloseModal] = useState(false);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [closeNotes, setCloseNotes] = useState("");
  const [result, setResult] = useState<{ methods: CloseMethod[]; totalDiff: number } | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const r = await fetch("/api/cash").then((r) => r.json());
    setSession(r.session);
    setMovements(r.movements ?? []);
    setSalesCount(r.salesCount ?? 0);
  }

  async function openCash() {
    setBusy(true);
    try {
      const res = await fetch("/api/cash", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingAmount: Number(openingAmount) || 0 }),
      });
      if (!res.ok) throw new Error();
      toast.success("Caixa aberto!");
      setOpeningAmount("");
      load();
    } catch { toast.error("Erro ao abrir caixa"); }
    finally { setBusy(false); }
  }

  async function saveMovement() {
    const amount = Number(movAmount);
    if (!amount || amount <= 0) return toast.error("Informe um valor válido");
    setBusy(true);
    try {
      const res = await fetch("/api/cash/movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: movModal, amount, reason: movReason }),
      });
      if (!res.ok) throw new Error();
      toast.success(movModal === "sangria" ? "Sangria registrada" : "Suprimento registrado");
      setMovModal(null);
      setMovAmount("");
      setMovReason("");
      load();
    } catch { toast.error("Erro ao registrar"); }
    finally { setBusy(false); }
  }

  async function closeCash() {
    setBusy(true);
    try {
      const res = await fetch("/api/cash/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countedCash: Number(counts.countedCash) || 0,
          countedPix: Number(counts.countedPix) || 0,
          countedDebit: Number(counts.countedDebit) || 0,
          countedCredit: Number(counts.countedCredit) || 0,
          notes: closeNotes,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setResult({ methods: data.methods, totalDiff: data.totalDiff });
      setCloseModal(false);
      setCounts({});
      setCloseNotes("");
      load();
    } catch { toast.error("Erro ao fechar caixa"); }
    finally { setBusy(false); }
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-foreground mb-5">🧾 Caixa</h1>

      {/* Resultado da conferência (após fechar) */}
      {result && (
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5 mb-5">
          <h2 className="font-bold text-foreground mb-3">Conferência do fechamento</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-subtle uppercase">
                <th className="text-left pb-2">Método</th>
                <th className="text-right pb-2">Esperado</th>
                <th className="text-right pb-2">Contado</th>
                <th className="text-right pb-2">Diferença</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.methods.map((m) => (
                <tr key={m.key}>
                  <td className="py-2 text-foreground">{m.label}</td>
                  <td className="py-2 text-right text-muted-foreground">{formatCurrency(m.expected)}</td>
                  <td className="py-2 text-right text-muted-foreground">{formatCurrency(m.counted)}</td>
                  <td className={cn("py-2 text-right font-semibold",
                    m.diff === 0 ? "text-success" : Math.abs(m.diff) < 0.01 ? "text-success" : m.diff > 0 ? "text-warning" : "text-danger")}>
                    {m.diff > 0 ? "+" : ""}{formatCurrency(m.diff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={cn("mt-3 px-3 py-2 rounded-xl text-sm font-semibold flex justify-between",
            Math.abs(result.totalDiff) < 0.01 ? "bg-success-soft text-success-foreground" : "bg-danger-soft text-danger-foreground")}>
            <span>{Math.abs(result.totalDiff) < 0.01 ? "✅ Caixa bateu certo" : "⚠️ Diferença total"}</span>
            <span>{result.totalDiff > 0 ? "+" : ""}{formatCurrency(result.totalDiff)}</span>
          </div>
          <button onClick={() => setResult(null)} className="mt-3 text-xs text-primary hover:underline">Fechar</button>
        </div>
      )}

      {!session ? (
        /* Caixa fechado — abrir */
        <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
          <p className="text-muted-foreground text-sm mb-4">Nenhum caixa aberto. Informe o fundo de troco para abrir.</p>
          <label className="text-xs font-medium text-muted-foreground">Fundo de troco (R$)</label>
          <input
            type="number" step="0.01" min="0"
            value={openingAmount}
            onChange={(e) => setOpeningAmount(e.target.value)}
            placeholder="0,00"
            className="w-full mt-1 mb-4 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={openCash}
            disabled={busy}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            Abrir caixa
          </button>
        </div>
      ) : (
        /* Caixa aberto */
        <div className="space-y-5">
          <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="px-2 py-0.5 rounded-full bg-success-soft text-success-foreground text-xs font-semibold">Aberto</span>
              <span className="text-xs text-subtle">desde {formatDateTime(session.openedAt)}</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-subtle">Fundo de troco</p>
                <p className="font-semibold text-foreground">{formatCurrency(session.openingAmount)}</p>
              </div>
              <div>
                <p className="text-xs text-subtle">Vendas no caixa</p>
                <p className="font-semibold text-foreground">{salesCount}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button onClick={() => setMovModal("sangria")} className="py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted">
                ➖ Sangria
              </button>
              <button onClick={() => setMovModal("suprimento")} className="py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-muted">
                ➕ Suprimento
              </button>
            </div>
            <button
              onClick={() => setCloseModal(true)}
              className="w-full mt-2 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold"
            >
              Fechar caixa
            </button>
          </div>

          {movements.length > 0 && (
            <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
              <h2 className="font-bold text-foreground text-sm mb-3">Movimentações</h2>
              <div className="space-y-2">
                {movements.map((m) => (
                  <div key={m.id} className="flex justify-between items-center text-sm">
                    <div>
                      <span className={cn("font-medium", m.type === "sangria" ? "text-danger" : "text-success")}>
                        {m.type === "sangria" ? "➖ Sangria" : "➕ Suprimento"}
                      </span>
                      {m.reason && <span className="text-subtle text-xs ml-2">{m.reason}</span>}
                    </div>
                    <span className="font-semibold text-foreground">{formatCurrency(m.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal sangria/suprimento */}
      {movModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-5">
            <h2 className="font-bold text-foreground mb-4">{movModal === "sangria" ? "➖ Sangria" : "➕ Suprimento"}</h2>
            <label className="text-xs font-medium text-muted-foreground">Valor (R$)</label>
            <input
              type="number" step="0.01" min="0" autoFocus
              value={movAmount}
              onChange={(e) => setMovAmount(e.target.value)}
              className="w-full mt-1 mb-3 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label className="text-xs font-medium text-muted-foreground">Motivo (opcional)</label>
            <input
              value={movReason}
              onChange={(e) => setMovReason(e.target.value)}
              placeholder={movModal === "sangria" ? "Ex: troco, pagamento fornecedor" : "Ex: reforço de troco"}
              className="w-full mt-1 mb-4 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-3">
              <button onClick={() => setMovModal(null)} className="flex-1 py-3 border border-border rounded-xl text-sm text-muted-foreground">Cancelar</button>
              <button onClick={saveMovement} disabled={busy} className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold disabled:opacity-50">Registrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal fechamento cego */}
      {closeModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-5 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-foreground mb-1">Fechamento cego</h2>
            <p className="text-xs text-subtle mb-4">Conte e informe os valores. O sistema confere com o registrado.</p>
            {COUNT_FIELDS.map((f) => (
              <div key={f.key} className="mb-3">
                <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                <input
                  type="number" step="0.01" min="0"
                  value={counts[f.key] ?? ""}
                  onChange={(e) => setCounts({ ...counts, [f.key]: e.target.value })}
                  placeholder="0,00"
                  className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ))}
            <label className="text-xs font-medium text-muted-foreground">Observações (opcional)</label>
            <input
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              className="w-full mt-1 mb-4 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-3">
              <button onClick={() => setCloseModal(false)} className="flex-1 py-3 border border-border rounded-xl text-sm text-muted-foreground">Cancelar</button>
              <button onClick={closeCash} disabled={busy} className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold disabled:opacity-50">Conferir e fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
