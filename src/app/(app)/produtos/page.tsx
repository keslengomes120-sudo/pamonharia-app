"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCurrency, formatPct, cn } from "@/lib/utils";

type Ingredient = { id: string; name: string; unit: string; costPerUnit: number };
type Category = { id: string; name: string };
type Product = {
  id: string; name: string; internalCode: string | null; categoryId: string | null; unit: string; tipo: string; purchasePrice: number;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeMarkup, setStoreMarkup] = useState(70);
  const [editing, setEditing] = useState<Partial<Product> | null>(null);
  const [fichaItems, setFichaItems] = useState<{ ingredientId: string; qtyPerUnit: number }[]>([]);
  const [markup, setMarkup] = useState(70);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const [p, i, c, s] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/ingredients").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
      fetch("/api/settings/store").then((r) => r.json()),
    ]);
    setProducts(p);
    setIngredients(i);
    if (Array.isArray(c)) setCategories(c);
    if (typeof s?.defaultMarkup === "number") setStoreMarkup(s.defaultMarkup);
  }

  function openNew() {
    setEditing({ name: "", internalCode: "", categoryId: "", unit: "un", tipo: "fabricacao", purchasePrice: 0, salePrice: 0, tipoProducao: "unitario", active: true });
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
    if (!editing.categoryId) return toast.error("Selecione uma categoria");
    setSaving(true);
    try {
      const method = editing.id ? "PUT" : "POST";
      const url = editing.id ? `/api/products/${editing.id}` : "/api/products";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editing, ingredients: fichaItems }),
      });
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: null }));
        throw new Error(error ?? "Erro ao salvar produto");
      }
      toast.success(editing.id ? "Produto atualizado!" : "Produto criado!");
      setEditing(null);
      load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Erro ao salvar produto"); }
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
        <h1 className="text-xl font-bold text-foreground">🥟 Produtos</h1>
        <button onClick={openNew} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover">
          + Novo Produto
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                {["Produto", "Preço", "Custo", "Margem", "Tipo", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => (
                <tr key={p.id} className={cn("hover:bg-muted", !p.active && "opacity-50")}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {p.name}
                    {p.internalCode && <span className="ml-2 text-xs text-subtle">#{p.internalCode}</span>}
                    {p.unit === "kg" && <span className="ml-1 text-xs text-subtle">/kg</span>}
                  </td>
                  <td className="px-4 py-3 text-primary font-semibold">{formatCurrency(p.salePrice)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatCurrency(p.cost)}</td>
                  <td className="px-4 py-3">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                      p.margin >= 50 ? "bg-success-soft text-success-foreground" :
                      p.margin >= 20 ? "bg-warning-soft text-warning-foreground" : "bg-danger-soft text-danger-foreground"
                    )}>
                      {formatPct(p.margin)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{p.tipo === "revenda" ? "🛒 Revenda" : "🏭 Fabricação"}</td>
                  <td className="px-4 py-3">
                    <span className={cn("text-xs", p.active ? "text-success" : "text-subtle")}>
                      {p.active ? "✅ Ativo" : "❌ Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(p)} className="text-primary text-xs hover:underline">Editar</button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-subtle">Nenhum produto cadastrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de edição */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-border flex justify-between">
              <h2 className="font-bold text-foreground">{editing.id ? "Editar Produto" : "Novo Produto"}</h2>
              <button onClick={() => setEditing(null)} className="text-subtle hover:text-muted-foreground">✕</button>
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
                        ? "bg-primary text-white border-primary"
                        : "bg-card text-muted-foreground border-border hover:border-primary"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Nome *</label>
                <input
                  value={editing.name ?? ""}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Ex: Pamonha Doce"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Categoria *</label>
                <select
                  value={editing.categoryId ?? ""}
                  onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                  className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <a href="/categorias" className="text-primary text-xs underline mt-1 inline-block">
                    Nenhuma categoria — cadastrar
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Código interno</label>
                  <input
                    value={editing.internalCode ?? ""}
                    onChange={(e) => setEditing({ ...editing, internalCode: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    placeholder="Ex: 2"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Unidade</label>
                  <select
                    value={editing.unit ?? "un"}
                    onChange={(e) => setEditing({ ...editing, unit: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="kg">Peso (kg)</option>
                  </select>
                </div>
              </div>

              {isRevenda && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Preço de compra (R$)</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={editing.purchasePrice ?? ""}
                      onChange={(e) => setEditing({ ...editing, purchasePrice: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}

              {/* Ficha Técnica (apenas fabricação própria) */}
              {!isRevenda && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-medium text-muted-foreground">🧪 Ficha Técnica (insumos)</label>
                    <button
                      onClick={() => setFichaItems([...fichaItems, { ingredientId: "", qtyPerUnit: 0 }])}
                      className="text-xs text-primary hover:underline"
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
                        className="flex-1 px-2 py-2 border border-border rounded-lg text-xs"
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
                        className="w-20 px-2 py-2 border border-border rounded-lg text-xs text-right"
                      />
                      <button
                        onClick={() => setFichaItems(fichaItems.filter((_, i) => i !== idx))}
                        className="text-danger px-2 text-sm"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Precificação */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Preço de venda (R$)</label>
                    <input
                      type="number" step="0.01" min="0"
                      value={editing.salePrice ?? ""}
                      onChange={(e) => setEditing({ ...editing, salePrice: Number(e.target.value) })}
                      className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Markup (%)</label>
                    <input
                      type="number" step="1" min="0"
                      value={markup}
                      onChange={(e) => setMarkup(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <button
                  onClick={suggestPrice}
                  className="w-full py-2 bg-primary-soft text-primary rounded-xl text-xs font-semibold hover:bg-primary-soft"
                >
                  ✨ Sugerir preço ({formatCurrency(round2(cost * (1 + markup / 100)))})
                </button>
              </div>

              {!isRevenda && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Tipo de produção</label>
                  <select
                    value={editing.tipoProducao ?? "unitario"}
                    onChange={(e) => setEditing({ ...editing, tipoProducao: e.target.value })}
                    className="w-full mt-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="unitario">📦 Unitário (baixa estoque na venda)</option>
                    <option value="lote">🏭 Lote</option>
                  </select>
                </div>
              )}

              {/* Resumo custo/margem */}
              <div className="bg-primary-soft rounded-xl px-3 py-2 text-xs space-y-0.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(cost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margem:</span>
                  <span className={cn("font-semibold", margin >= 30 ? "text-success" : "text-danger")}>
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
                <label htmlFor="active" className="text-sm text-foreground">Produto ativo</label>
              </div>
            </div>

            <div className="p-5 border-t border-border flex gap-3">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 border border-border rounded-xl text-sm text-muted-foreground">
                Cancelar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold disabled:opacity-50"
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
