"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCurrency, formatPct, cn } from "@/lib/utils";

type Ingredient = { id: string; name: string; unit: string; costPerUnit: number };
type Product = {
  id: string; name: string; tipo: string; purchasePrice: number;
  salePrice: number; cost: number; margin: number;
  active: boolean; tipoProducao: string;
  category?: { name: string; color: string };
  productIngredients: { ingredientId: string; qtyPerUnit: number; ingredient: { name: string; unit: string; costPerUnit: number } }[];
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default function ProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [storeMarkup, setStoreMarkup] = useState(70);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [fichaItems, setFichaItems] = useState<{ ingredientId: string; qtyPerUnit: number }[]>([]);
  const [markup, setMarkup] = useState(70);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [p, i, s] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/ingredients").then((r) => r.json()),
      fetch("/api/settings/store").then((r) => r.json()),
    ]);
    setProducts(p);
    setIngredients(i);
    if (typeof s?.defaultMarkup === "number") setStoreMarkup(s.defaultMarkup);
  }

  function openNew() {
    setEditing({ name: "", tipo: "fabricacao", purchasePrice: 0, salePrice: 0, tipoProducao: "unitario", active: true });
    setFichaItems([]);
    setMarkup(storeMarkup);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setFichaItems(p.productIngredients.map((pi) => ({ ingredientId: pi.ingredientId, qtyPerUnit: pi.qtyPerUnit })));
    setMarkup(p.cost > 0 ? round2((p.salePrice / p.cost - 1) * 100) : storeMarkup);
  }

  async function save() {
    if (!editing?.name) return toast.error("Nome obrigatório");
    setSaving(true);
    try {
      const method = editing.id ? "PUT" : "POST";
      const url = editing.id ? `/api/products/${editing.id}` : "/api/products";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editing, ingredients: fichaItems }),
      });
      if (!res.ok) throw new Error();
      toast.success(editing.id ? "Produto atualizado!" : "Produto criado!");
      setEditing(null);
      load();
    } catch { toast.error("Erro ao salvar produto"); }
    finally { setSaving(false); }
  }

  const isRevenda = editing?.tipo === "revenda";

  const fichaCost = fichaItems.reduce((s, fi) => {
    const ing = ingredients.find((i) => i.id === fi.ingredientId);
    return s + (ing?.costPerUnit ?? 0) * fi.qtyPerUnit;
  }, 0);

  const cost = isRevenda ? (editing?.purchasePrice ?? 0) : fichaCost;
  const salePrice = editing?.salePrice ?? 0;
  const margin = salePrice > 0 ? ((salePrice - cost) / salePrice) * 100 : 0;

  function suggestPrice() {
    if (cost <= 0) return toast.error(isRevenda ? "Informe o preço de compra" : "Monte a ficha técnica primeiro");
    setEditing((e) => ({ ...e, salePrice: round2(cost * (1 + markup / 100)) }));
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">🥟 Produtos</h1>
        <button onClick={openNew} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600">
          + Novo Produto
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Produto", "Preço", "Custo", "Margem", "Tipo", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map((p) => (
                <tr key={p.id} className={cn("hover:bg-gray-50", !p.active && "opacity-50")}>
                  <td className="px-4 py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-orange-600 font-semibold">{formatCurrency(p.salePrice)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(p.cost)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                      p.margin >= 50 ? "bg-green-100 text-green-700" :
                      p.margin >= 20 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                    )}>
                      {formatPct(p.margin)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.tipo === "revenda" ? "🛒 Revenda" : "🏭 Fabricação"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs", p.active ? "text-green-600" : "text-gray-400")}>
                      {p.active ? "✅ Ativo" : "❌ Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(p)} className="text-orange-500 text-xs hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-gray-300">Nenhum produto cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edição */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-100 flex justify-between">
              <h2 className="font-bold text-gray-900">{editing.id ? "Editar Produto" : "Novo Produto"}</h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="p-5 space-y-4">
              {/* Tipo de produto */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: "fabricacao", label: "🏭 Fabricação própria" },
                  { v: "revenda", label: "🛒 Compra/Revenda" },
                ].map((t) => (
                  <button
                    key={t.v}
                    onClick={() => setEditing({ ...editing, tipo: t.v })}
                    className={cn(
                      "py-2.5 rounded-xl text-sm font-medium border transition-colors",
                      editing.tipo === t.v
                        ? "bg-orange-500 text-white border-orange-500"
                        : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600">Nome *</label>
                <input
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Ex: Pamonha Doce"
                />
              </div>

              {isRevenda && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Preço de compra (R$)</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={editing.purchasePrice ?? ""}
                      onChange={(e) => setEditing({ ...editing, purchasePrice: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
              )}

              {/* Ficha Técnica (apenas fabricação própria) */}
              {!isRevenda && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-gray-600">🧪 Ficha Técnica (insumos)</label>
                    <button
                      onClick={() => setFichaItems([...fichaItems, { ingredientId: "", qtyPerUnit: 0 }])}
                      className="text-xs text-orange-500 hover:underline"
                    >
                      + Adicionar insumo
                    </button>
                  </div>

                  {fichaItems.map((fi, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <select
                        value={fi.ingredientId}
                        onChange={(e) => {
                          const updated = [...fichaItems];
                          updated[idx] = { ...updated[idx], ingredientId: e.target.value };
                          setFichaItems(updated);
                        }}
                        className="flex-1 px-2 py-2 border border-gray-200 rounded-lg text-xs"
                      >
                        <option value="">Selecionar insumo</option>
                        {ingredients.map((i) => (
                          <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                        ))}
                      </select>
                      <input
                        type="number" step="0.001" min="0"
                        value={fi.qtyPerUnit || ""}
                        onChange={(e) => {
                          const updated = [...fichaItems];
                          updated[idx] = { ...updated[idx], qtyPerUnit: Number(e.target.value) };
                          setFichaItems(updated);
                        }}
                        placeholder="Qtd"
                        className="w-20 px-2 py-2 border border-gray-200 rounded-lg text-xs text-right"
                      />
                      <button
                        onClick={() => setFichaItems(fichaItems.filter((_, i) => i !== idx))}
                        className="text-red-400 px-2 text-sm"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Precificação */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">Preço de venda (R$)</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={editing.salePrice ?? ""}
                      onChange={(e) => setEditing({ ...editing, salePrice: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">Markup (%)</label>
                    <input
                      type="number" step="1" min="0"
                      value={markup}
                      onChange={(e) => setMarkup(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    />
                  </div>
                </div>
                <button
                  onClick={suggestPrice}
                  className="w-full py-2 bg-orange-50 text-orange-600 rounded-xl text-xs font-semibold hover:bg-orange-100"
                >
                  ✨ Sugerir preço ({formatCurrency(round2(cost * (1 + markup / 100)))})
                </button>
              </div>

              {!isRevenda && (
                <div>
                  <label className="text-xs font-medium text-gray-600">Tipo de produção</label>
                  <select
                    value={editing.tipoProducao ?? "unitario"}
                    onChange={(e) => setEditing({ ...editing, tipoProducao: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  >
                    <option value="unitario">📦 Unitário (baixa estoque na venda)</option>
                    <option value="lote">🏭 Lote</option>
                  </select>
                </div>
              )}

              {/* Resumo custo/margem */}
              <div className="bg-orange-50 rounded-xl px-3 py-2 text-xs space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-gray-600">Custo:</span>
                  <span className="font-semibold text-gray-800">{formatCurrency(cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Margem:</span>
                  <span className={cn("font-semibold", margin >= 30 ? "text-green-600" : "text-red-600")}>
                    {formatPct(margin)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={editing.active ?? true}
                  onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                  className="w-4 h-4 accent-orange-500"
                />
                <label htmlFor="active" className="text-sm text-gray-700">Produto ativo</label>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600">
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
