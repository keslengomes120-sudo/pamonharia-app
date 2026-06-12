"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Customer = { id: string; name: string; phone: string | null; notes: string | null; _count: { sales: number } };

export default function ClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Partial<Customer> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await fetch(`/api/customers${q ? `?q=${encodeURIComponent(q)}` : ""}`).then((r) => r.json());
    setCustomers(data);
  }

  async function save() {
    if (!editing?.name) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      const method = editing.id ? "PUT" : "POST";
      const url = editing.id ? `/api/customers/${editing.id}` : "/api/customers";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editing.name, phone: editing.phone, notes: editing.notes }),
      });
      if (!res.ok) throw new Error();
      toast.success(editing.id ? "Cliente atualizado!" : "Cliente cadastrado!");
      setEditing(null);
      load();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function del(id: string, name: string) {
    if (!confirm(`Remover "${name}"?`)) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Cliente removido"); load(); }
    else toast.error("Erro ao remover");
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-foreground">👥 Clientes</h1>
        <button onClick={() => setEditing({ name: "", phone: "", notes: "" })}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover">
          + Novo
        </button>
      </div>

      <div className="mb-4">
        <input value={q} onChange={(e) => { setQ(e.target.value); }}
          onBlur={() => load()}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="🔍 Buscar cliente..."
          className="w-full px-4 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border divide-y divide-border">
        {customers.length === 0 ? (
          <div className="py-12 text-center text-subtle">Nenhum cliente cadastrado</div>
        ) : customers.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-5 py-4">
            <div className="w-9 h-9 rounded-full bg-primary-soft flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
              {c.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">{c.name}</p>
              <p className="text-xs text-subtle">{c.phone ?? "—"} · {c._count.sales} pedido{c._count.sales !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={() => setEditing(c)} className="text-xs text-primary hover:underline px-2">Editar</button>
            <button onClick={() => del(c.id, c.name)} className="text-xs text-danger hover:underline px-2">✕</button>
          </div>
        ))}
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm">
            <div className="p-5 border-b border-border flex justify-between">
              <h2 className="font-bold text-foreground">{editing.id ? "Editar Cliente" : "Novo Cliente"}</h2>
              <button onClick={() => setEditing(null)} className="text-subtle">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                <input value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Nome completo" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Telefone</label>
                <input value={editing.phone ?? ""}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Observações</label>
                <textarea value={editing.notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  rows={2}
                  className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  placeholder="Preferências, alergias..." />
              </div>
            </div>
            <div className="p-5 border-t border-border flex gap-3">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-3 border border-border rounded-xl text-sm text-muted-foreground">Cancelar</button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
