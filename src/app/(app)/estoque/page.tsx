"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";

type Ingredient = {
  id: string; name: string; unit: string; stockQty: number;
  minStock: number; costPerUnit: number; isLow: boolean; isCritical: boolean;
};

const UNITS = ["kg", "g", "L", "mL", "un", "pacote", "cx", "dz"];

export default function EstoquePage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [editing, setEditing] = useState<Partial<Ingredient> | null>(null);
  const [movement, setMovement] = useState<{ id: string; name: string } | null>(null);
  const [movType, setMovType] = useState("entrada");
  const [movQty, setMovQty] = useState("");
  const [movCost, setMovCost] = useState("");
  const [movNote, setMovNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const r = await fetch("/api/ingredients").then((r) => r.json());
    setItems(r);
  }

  async function saveIngredient() {
    if (!editing?.name) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      const method = editing.id ? "PUT" : "POST";
      const url = editing.id ? `/api/ingredients/${editing.id}` : "/api/ingredients";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      if (!res.ok) throw new Error();
      toast.success(editing.id ? "Insumo atualizado!" : "Insumo cadastrado!");
      setEditing(null);
      load();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function saveMovement() {
    if (!movement || !movQty) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/ingredients/${movement.id}/movement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: movType, qty: Number(movQty), unitCost: movCost ? Number(movCost) : undefined, note: movNote }),
      });
      if (!res.ok) throw new Error();
      toast.success("Movimentação registrada!");
      setMovement(null); setMovQty(""); setMovCost(""); setMovNote("");
      load();
    } catch { toast.error("Erro ao registrar"); }
    finally { setSaving(false); }
  }

  const lowCount = items.filter((i) => i.isLow).length;

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">📦 Estoque</h1>
        <button onClick={() => setEditing({ unit: "kg", stockQty: 0, minStock: 0, costPerUnit: 0 })}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover">
          + Novo Insumo
        </button>
      </div>

      {lowCount > 0 && (
        <div className="bg-warning-soft border border-amber-200 rounded-xl px-4 py-3 mb-4 text-sm text-warning-foreground">
          ⚠️ <strong>{lowCount} insumo{lowCount > 1 ? "s" : ""}</strong> com estoque baixo ou zerado
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["Insumo", "Estoque atual", "Mínimo", "Custo/un", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((i) => (
                <tr key={i.id} className="hover:bg-muted">
                  <td className="px-4 py-3 font-medium text-foreground">{i.name}</td>
                  <td className="px-4 py-3">
                    <span className={cn("font-semibold", i.isCritical ? "text-danger" : i.isLow ? "text-warning" : "text-foreground")}>
                      {i.stockQty} {i.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{i.minStock} {i.unit}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatCurrency(i.costPerUnit)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                      i.isCritical ? "bg-danger-soft text-danger-foreground" :
                      i.isLow ? "bg-warning-soft text-warning-foreground" : "bg-success-soft text-success-foreground"
                    )}>
                      {i.isCritical ? "🔴 Crítico" : i.isLow ? "⚠️ Baixo" : "✅ OK"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => setMovement({ id: i.id, name: i.name })}
                      className="text-xs text-blue-500 hover:underline">Movimentar</button>
                    <button onClick={() => setEditing(i)}
                      className="text-xs text-primary hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-subtle">Nenhum insumo cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Insumo */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md">
            <div className="p-5 border-b flex justify-between">
              <h2 className="font-bold">{editing.id ? "Editar Insumo" : "Novo Insumo"}</h2>
              <button onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: "Nome *", key: "name", type: "text", placeholder: "Ex: Milho" },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  <input
                    type={type} value={(editing as any)[key] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Unidade</label>
                  <select value={editing.unit ?? "kg"} onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm">
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Custo por unidade (R$)</label>
                  <input type="number" step="0.01" min="0" value={editing.costPerUnit ?? ""}
                    onChange={(e) => setEditing({ ...editing, costPerUnit: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Estoque atual</label>
                  <input type="number" step="0.001" min="0" value={editing.stockQty ?? ""}
                    onChange={(e) => setEditing({ ...editing, stockQty: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Estoque mínimo</label>
                  <input type="number" step="0.001" min="0" value={editing.minStock ?? ""}
                    onChange={(e) => setEditing({ ...editing, minStock: Number(e.target.value) })}
                    className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 border rounded-xl text-sm text-muted-foreground">Cancelar</button>
              <button onClick={saveIngredient} disabled={saving}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Movimentação */}
      {movement && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm">
            <div className="p-5 border-b flex justify-between">
              <h2 className="font-bold">Movimentar: {movement.name}</h2>
              <button onClick={() => setMovement(null)}>✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "entrada", label: "⬆️ Entrada", color: "green" },
                  { id: "saida_perda", label: "⬇️ Saída/Perda", color: "red" },
                  { id: "ajuste", label: "🔄 Ajuste", color: "blue" },
                ].map((t) => (
                  <button key={t.id} onClick={() => setMovType(t.id)}
                    className={cn("py-2 rounded-xl text-sm font-medium border",
                      movType === t.id ? "bg-primary-soft border-primary text-primary-soft-foreground" : "border-border text-muted-foreground"
                    )}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Quantidade *</label>
                <input type="number" step="0.001" min="0" value={movQty}
                  onChange={(e) => setMovQty(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {movType === "entrada" && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Custo unitário (R$)</label>
                  <input type="number" step="0.01" min="0" value={movCost}
                    onChange={(e) => setMovCost(e.target.value)} placeholder="Atualiza o custo do insumo"
                    className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground">Observação</label>
                <input value={movNote} onChange={(e) => setMovNote(e.target.value)} placeholder="Ex: Compra mercado"
                  className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm" />
              </div>
            </div>
            <div className="p-5 border-t flex gap-3">
              <button onClick={() => setMovement(null)} className="flex-1 py-3 border rounded-xl text-sm text-muted-foreground">Cancelar</button>
              <button onClick={saveMovement} disabled={saving}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? "..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
