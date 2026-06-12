"use client";
import { useEffect, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { formatCurrency, formatQty } from "@/lib/utils";

type Product = { id: string; name: string; salePrice: number; internalCode: string | null; unit: string };
type LocalItem = { productId: string; qty: number; name: string; unitPrice: number; unit: string };
type Comanda = {
  id: string; label: string; total: number;
  customer?: { name: string } | null;
  items: { productId: string; qty: number }[];
};
type Customer = { id: string; name: string };

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

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
  const [codeInput, setCodeInput] = useState("");
  const [searchComanda, setSearchComanda] = useState("");

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
    setItems(c.items.map((i: any) => ({ productId: i.productId, qty: i.qty, name: i.product.name, unitPrice: i.unitPrice, unit: i.product.unit })));
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

  function addProduct(p: Product, addQty = 1) {
    const existing = items.find((i) => i.productId === p.id);
    const next = existing
      ? items.map((i) => i.productId === p.id ? { ...i, qty: round3(i.qty + addQty) } : i)
      : [...items, { productId: p.id, qty: addQty, name: p.name, unitPrice: p.salePrice, unit: p.unit }];
    persist(next);
  }

  function addByCode(raw: string) {
    const input = raw.trim();
    if (!input) return;

    let weight: number | null = null;
    let code = input;
    if (input.includes("*")) {
      const [w, c] = input.split("*");
      weight = parseFloat(w.replace(",", "."));
      code = (c ?? "").trim();
      if (!isFinite(weight) || weight <= 0) return toast.error("Peso inválido");
    }

    const p = products.find((x) => x.internalCode && x.internalCode === code);
    if (!p) return toast.error(`Código ${code} não encontrado`);

    if (p.unit === "kg") {
      if (weight === null) return toast.error(`${p.name} é vendido por peso: use peso*${code}`);
      addProduct(p, weight);
    } else {
      if (weight !== null) return toast.error(`${p.name} não é vendido por peso`);
      addProduct(p, 1);
    }
  }

  function handleCodeKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!codeInput.trim()) return closeDetail();
    addByCode(codeInput);
    setCodeInput("");
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

  function keepInComanda() {
    toast.success("Itens salvos na comanda");
    closeDetail();
    loadAll();
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

  const filteredComandas = searchComanda.trim()
    ? comandas.filter((c) => c.label.toLowerCase().includes(searchComanda.trim().toLowerCase()))
    : comandas;

  function handleSearchKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    if (filteredComandas.length > 0) openComanda(filteredComandas[0].id);
  }

  if (selectedId) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-muted">
        <div className="flex-1 p-4">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={closeDetail} className="text-muted-foreground text-sm">← Voltar</button>
            <h1 className="text-lg font-bold text-foreground">📝 {selectedLabel}</h1>
          </div>
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            onKeyDown={handleCodeKey}
            autoFocus
            placeholder="Código ou peso*código (ex: 0,360*2) — Enter vazio volta"
            className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((p) => (
              <button
                key={p.id}
                onClick={() => addProduct(p)}
                className="bg-card rounded-2xl p-4 shadow-sm border border-border text-left active:scale-95 transition-transform hover:border-primary hover:shadow-md"
              >
                <div className="text-3xl mb-2">🥟</div>
                <p className="font-semibold text-foreground text-sm leading-tight">
                  {p.name}
                  {p.internalCode && <span className="ml-1 text-xs text-subtle">#{p.internalCode}</span>}
                </p>
                <p className="text-primary font-bold mt-2">{formatCurrency(p.salePrice)}{p.unit === "kg" && <span className="text-xs text-subtle">/kg</span>}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="md:w-80 bg-card border-t md:border-t-0 md:border-l border-border flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-foreground">Itens da comanda</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {items.length === 0 ? (
              <p className="text-center text-subtle py-8 text-sm">Toque nos produtos pra adicionar</p>
            ) : (
              items.map((item) => (
                <div key={item.productId} className="flex items-center gap-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-primary">{formatCurrency(item.unitPrice)}{item.unit === "kg" && "/kg"}</p>
                  </div>
                  {item.unit === "kg" ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{formatQty(item.qty)} kg</span>
                      <button onClick={() => changeQty(item.productId, 0)} className="text-danger text-sm">✕</button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button onClick={() => changeQty(item.productId, item.qty - 1)} className="w-7 h-7 rounded-lg bg-muted text-muted-foreground font-bold flex items-center justify-center">−</button>
                      <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                      <button onClick={() => changeQty(item.productId, item.qty + 1)} className="w-7 h-7 rounded-lg bg-primary-soft text-primary-soft-foreground font-bold flex items-center justify-center">+</button>
                    </div>
                  )}
                  <p className="text-sm font-semibold text-foreground w-16 text-right">{formatCurrency(item.unitPrice * item.qty)}</p>
                </div>
              ))
            )}
          </div>
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
            </div>
            <button onClick={keepInComanda} className="w-full py-3 border border-primary text-primary font-semibold rounded-2xl hover:bg-primary-soft">
              📋 Colocar na comanda
            </button>
            <button onClick={sendToCheckout} className="w-full py-4 bg-primary hover:bg-primary-hover text-white font-bold rounded-2xl">
              💰 Enviar pro caixa
            </button>
            <button onClick={cancelComanda} className="w-full py-2.5 text-danger text-sm font-medium hover:bg-danger-soft rounded-xl">
              Cancelar comanda
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground">📝 Comandas</h1>
        <button onClick={() => setCreating(true)} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover">
          + Nova comanda
        </button>
      </div>

      <input
        value={searchComanda}
        onChange={(e) => setSearchComanda(e.target.value)}
        onKeyDown={handleSearchKey}
        placeholder="🔍 Abrir comanda pelo nome (Enter abre a primeira)"
        className="w-full mb-5 px-3 py-2.5 border border-border rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
      />

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredComandas.map((c) => (
          <button
            key={c.id}
            onClick={() => openComanda(c.id)}
            className="aspect-square bg-card rounded-2xl p-3 shadow-sm border border-border flex flex-col justify-between text-left hover:border-primary hover:shadow-md transition-all"
          >
            <div>
              <p className="font-bold text-foreground text-sm leading-tight">{c.label}</p>
              {c.customer && <p className="text-xs text-subtle leading-tight">{c.customer.name}</p>}
            </div>
            <div>
              <p className="text-xs text-subtle">{c.items.length} {c.items.length === 1 ? "item" : "itens"}</p>
              <p className="text-primary font-bold text-sm">{formatCurrency(c.total)}</p>
            </div>
          </button>
        ))}
      </div>
      {filteredComandas.length === 0 && (
        <div className="text-center py-16 text-subtle">
          <p className="text-4xl mb-2">📝</p>
          <p>{comandas.length === 0 ? "Nenhuma comanda aberta" : "Nenhuma comanda encontrada"}</p>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end md:items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm p-5">
            <h2 className="font-bold text-foreground mb-4">Nova comanda</h2>
            <label className="text-xs font-medium text-muted-foreground">Identificação *</label>
            <input
              value={newLabel} autoFocus
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ex: Mesa 5, João"
              className="w-full mt-1 mb-3 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <label className="text-xs font-medium text-muted-foreground">Cliente (opcional)</label>
            <select
              value={newCustomer}
              onChange={(e) => setNewCustomer(e.target.value)}
              className="w-full mt-1 mb-4 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">—</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setCreating(false)} className="flex-1 py-3 border border-border rounded-xl text-sm text-muted-foreground">Cancelar</button>
              <button onClick={createComanda} className="flex-1 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-sm font-semibold">Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
