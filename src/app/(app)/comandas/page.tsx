"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";

type Product = { id: string; name: string; salePrice: number };
type LocalItem = { productId: string; qty: number; name: string; unitPrice: number };
type Comanda = {
  id: string; label: string; total: number;
  customer?: { name: string } | null;
  items: { productId: string; qty: number }[];
};
type Customer = { id: string; name: string };

export default function ComandasPage() {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  const [creating, setCreating] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCustomer, setNewCustomer] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedLabel, setSelectedLabel] = useState("");
  const [items, setItems] = useState<LocalItem[]>([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [c, p, cu] = await Promise.all([
      fetch("/api/comandas").then((r) => r.json()),
      fetch("/api/products?active=true").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
    ]);
    setComandas(c);
    setProducts(p);
    setCustomers(cu);
  }

  async function createComanda() {
    if (!newLabel.trim()) return toast.error("Informe a identificação");
    try {
      const res = await fetch("/api/comandas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim(), customerId: newCustomer || null }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setCreating(false);
      setNewLabel("");
      setNewCustomer("");
      openComanda(created.id);
      loadAll();
    } catch { toast.error("Erro ao criar comanda"); }
  }

  async function openComanda(id: string) {
    const c = await fetch(`/api/comandas/${id}`).then((r) => r.json());
    setSelectedId(id);
    setSelectedLabel(c.label);
    setItems(c.items.map((i: any) => ({ productId: i.productId, qty: i.qty, name: i.product.name, unitPrice: i.unitPrice })));
  }

  async function persist(next: LocalItem[]) {
    setItems(next);
    if (!selectedId) return;
    await fetch(`/api/comandas/${selectedId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: next.map((i) => ({ productId: i.productId, qty: i.qty })) }),
    });
  }

  function addProduct(p: Product) {
    const existing = items.find((i) => i.productId === p.id);
    const next = existing
      ? items.map((i) => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i)
      : [...items, { productId: p.id, qty: 1, name: p.name, unitPrice: p.salePrice }];
    persist(next);
  }

  function changeQty(productId: string, qty: number) {
    const next = qty <= 0
      ? items.filter((i) => i.productId !== productId)
      : items.map((i) => i.productId === productId ? { ...i, qty } : i);
    persist(next);
  }

  function sendToCheckout() {
    if (!items.length) return toast.error("Comanda vazia");
    window.location.href = `/pdv?comanda=${selectedId}`;
  }

  async function cancelComanda() {
    if (!selectedId) return;
    if (!confirm("Cancelar esta comanda?")) return;
    await fetch(`/api/comandas/${selectedId}`, { method: "DELETE" });
    toast.success("Comanda cancelada");
    closeDetail();
    loadAll();
  }

  function closeDetail() {
    setSelectedId(null);
    setItems([]);
  }

  const total = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  if (selectedId) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={closeDetail} className="text-gray-500 text-sm">← Voltar</button>
            <h1 className="text-lg font-bold text-gray-900">📝 {selectedLabel}</h1>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-95 transition-transform hover:border-orange-300 hover:shadow-md"
              >
                <div className="text-3xl mb-2">🥟</div>
                <p className="font-semibold text-gray-900 text-sm leading-tight">{p.name}</p>
                <p className="text-orange-600 font-bold mt-2">{formatCurrency(p.salePrice)}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="md:w-80 bg-white border-t md:border-t-0 md:border-l border-gray-100 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Itens da comanda</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {items.length === 0 ? (
              <p className="text-center text-gray-300 py-8 text-sm">Toque nos produtos pra adicionar</p>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-orange-600">{formatCurrency(item.unitPrice)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => changeQty(item.productId, item.qty - 1)} className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 font-bold flex items-center justify-center">−</button>
                    <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                    <button onClick={() => changeQty(item.productId, item.qty + 1)} className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-bold flex items-center justify-center">+</button>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 w-16 text-right">{formatCurrency(item.unitPrice * item.qty)}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-2xl font-bold text-orange-600">{formatCurrency(total)}</span>
            </div>
            <button onClick={sendToCheckout} className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl">
              💰 Enviar pro caixa
            </button>
            <button onClick={cancelComanda} className="w-full py-2.5 text-red-500 text-sm font-medium hover:bg-red-50 rounded-xl">
              Cancelar comanda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-900">📝 Comandas</h1>
        <button onClick={() => setCreating(true)} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600">
          + Nova comanda
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {comandas.map((c) => (
          <button
            key={c.id}
            onClick={() => openComanda(c.id)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left hover:border-orange-300 hover:shadow-md transition-all"
          >
            <p className="font-bold text-gray-900">{c.label}</p>
            {c.customer && <p className="text-xs text-gray-400">{c.customer.name}</p>}
            <p className="text-xs text-gray-400 mt-2">{c.items.length} {c.items.length === 1 ? "item" : "itens"}</p>
            <p className="text-orange-600 font-bold mt-1">{formatCurrency(c.total)}</p>
          </button>
        ))}
      </div>
      {comandas.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📝</p>
          <p>Nenhuma comanda aberta</p>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">Nova comanda</h2>
            <label className="text-xs font-medium text-gray-600">Identificação *</label>
            <input
              value={newLabel} autoFocus
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ex: Mesa 5, João"
              className="w-full mt-1 mb-3 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <label className="text-xs font-medium text-gray-600">Cliente (opcional)</label>
            <select
              value={newCustomer}
              onChange={(e) => setNewCustomer(e.target.value)}
              className="w-full mt-1 mb-4 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              <option value="">—</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setCreating(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm text-gray-600">Cancelar</button>
              <button onClick={createComanda} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold">Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
