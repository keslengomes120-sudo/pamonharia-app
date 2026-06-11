"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type Category = { id: string; name: string; color: string; _count: { products: number } };

const PRESET_COLORS = [
  "#f97316", "#ef4444", "#eab308", "#22c55e", "#3b82f6",
  "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#6b7280",
];

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Partial<Category> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await fetch("/api/categories").then((r) => r.json());
    setCategories(data);
  }

  function openNew() {
    setEditing({ name: "", color: "#f97316" });
  }

  async function save() {
    if (!editing?.name) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      const method = editing.id ? "PUT" : "POST";
      const url = editing.id ? `/api/categories/${editing.id}` : "/api/categories";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editing.name, color: editing.color }),
      });
      if (!res.ok) throw new Error();
      toast.success(editing.id ? "Categoria atualizada!" : "Categoria criada!");
      setEditing(null);
      load();
    } catch { toast.error("Erro ao salvar"); }
    finally { setSaving(false); }
  }

  async function del(id: string, name: string) {
    if (!confirm(`Deletar categoria "${name}"? Os produtos não serão apagados.`)) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("Categoria deletada"); load(); }
    else toast.error("Erro ao deletar");
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">🏷️ Categorias</h1>
        <button onClick={openNew}
          className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600">
          + Nova
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {categories.length === 0 ? (
          <div className="py-12 text-center text-gray-300">Nenhuma categoria ainda</div>
        ) : categories.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-5 py-4">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-sm">{c.name}</p>
              <p className="text-xs text-gray-400">{c._count.products} produto{c._count.products !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={() => setEditing(c)}
              className="text-xs text-orange-500 hover:underline px-2">Editar</button>
            <button onClick={() => del(c.id, c.name)}
              className="text-xs text-red-400 hover:underline px-2">Excluir</button>
          </div>
        ))}
      </div>

      {editing !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="p-5 border-b border-gray-100 flex justify-between">
              <h2 className="font-bold text-gray-900">{editing.id ? "Editar Categoria" : "Nova Categoria"}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-600">Nome *</label>
                <input value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Ex: Salgada, Doce, Bebida..." />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600">Cor</label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {PRESET_COLORS.map((color) => (
                    <button key={color} onClick={() => setEditing({ ...editing, color })}
                      className={`w-8 h-8 rounded-full transition-transform ${editing.color === color ? "scale-125 ring-2 ring-offset-1 ring-gray-400" : "hover:scale-110"}`}
                      style={{ backgroundColor: color }} />
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <div className="w-8 h-8 rounded-full border border-gray-200" style={{ backgroundColor: editing.color }} />
                  <input type="color" value={editing.color ?? "#f97316"}
                    onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                    className="h-8 w-16 rounded border border-gray-200 cursor-pointer" />
                  <span className="text-xs text-gray-400">Ou escolha uma cor personalizada</span>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-3 bg-orange-500 text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
