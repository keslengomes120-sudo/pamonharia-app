"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type User = { id: string; name: string; email: string; role: string; active: boolean };

const ROLES = [
  { id: "admin", label: "Admin", desc: "Acesso total ao sistema" },
  { id: "operador", label: "Operador", desc: "Somente PDV e IA" },
];

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [editing, setEditing] = useState<Partial<User & { password: string }> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await fetch("/api/users").then((r) => r.json());
    if (Array.isArray(data)) setUsers(data);
  }

  function openNew() {
    setEditing({ name: "", email: "", password: "", role: "operador", active: true });
  }

  async function save() {
    if (!editing?.name || !editing.email) return toast.error("Nome e email obrigatórios");
    if (!editing.id && !editing.password) return toast.error("Senha obrigatória para novo usuário");
    setSaving(true);
    try {
      const method = editing.id ? "PUT" : "POST";
      const url = editing.id ? `/api/users/${editing.id}` : "/api/users";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro");
      toast.success(editing.id ? "Usuário atualizado!" : "Usuário criado!");
      setEditing(null);
      load();
    } catch (e: any) { toast.error(e.message ?? "Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function toggleActive(u: User) {
    await fetch(`/api/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...u, active: !u.active }),
    });
    load();
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-foreground">🧑‍💼 Usuários</h1>
          <p className="text-xs text-subtle mt-0.5">Gerencie quem tem acesso ao sistema</p>
        </div>
        <button onClick={openNew}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover">
          + Novo
        </button>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border divide-y divide-border">
        {users.length === 0 ? (
          <div className="py-12 text-center text-subtle">Nenhum usuário</div>
        ) : users.map((u) => (
          <div key={u.id} className={cn("flex items-center gap-3 px-5 py-4", !u.active && "opacity-50")}>
            <div className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
              u.role === "admin" ? "bg-primary-soft text-primary-soft-foreground" : "bg-muted text-muted-foreground"
            )}>
              {u.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm">{u.name}</p>
              <p className="text-xs text-subtle">{u.email}</p>
            </div>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full font-medium",
              u.role === "admin" ? "bg-primary-soft text-primary-soft-foreground" : "bg-muted text-muted-foreground"
            )}>
              {u.role === "admin" ? "Admin" : "Operador"}
            </span>
            <button onClick={() => setEditing(u)} className="text-xs text-primary hover:underline px-1">Editar</button>
            <button onClick={() => toggleActive(u)}
              className={cn("text-xs px-1", u.active ? "text-subtle hover:text-danger" : "text-success hover:text-success-foreground")}>
              {u.active ? "Desativar" : "Ativar"}
            </button>
          </div>
        ))}
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm">
            <div className="p-5 border-b border-border flex justify-between">
              <h2 className="font-bold text-foreground">{editing.id ? "Editar Usuário" : "Novo Usuário"}</h2>
              <button onClick={() => setEditing(null)} className="text-subtle">✕</button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                <input value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              {!editing.id && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email *</label>
                  <input type="email" value={editing.email ?? ""}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {editing.id ? "Nova senha (deixe em branco pra manter)" : "Senha *"}
                </label>
                <input type="password" value={(editing as any).password ?? ""}
                  onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-2">Permissão</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => (
                    <button key={r.id} onClick={() => setEditing({ ...editing, role: r.id })}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-colors",
                        editing.role === r.id ? "border-primary bg-primary-soft" : "border-border hover:border-border"
                      )}>
                      <p className="text-sm font-medium text-foreground">{r.label}</p>
                      <p className="text-xs text-subtle mt-0.5">{r.desc}</p>
                    </button>
                  ))}
                </div>
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
