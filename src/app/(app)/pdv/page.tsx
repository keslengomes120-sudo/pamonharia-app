"use client";
import { useEffect, useState, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { formatCurrency, formatQty, cn } from "@/lib/utils";

type Product = { id: string; name: string; salePrice: number; internalCode: string | null; unit: string; category?: { name: string; color: string }; cost: number };
type CartItem = Product & { qty: number };

function round3(n: number) {
  return Math.round(n * 1000) / 1000;
}

const PAYMENT_METHODS = [
  { id: "dinheiro", label: "Dinheiro", icon: "💵" },
  { id: "pix", label: "PIX", icon: "📱" },
  { id: "debito", label: "Débito", icon: "💳" },
  { id: "credito", label: "Crédito", icon: "💳" },
];

export default function PDVPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payment, setPayment] = useState("pix");
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [change, setChange] = useState(0);
  const [cashReceived, setCashReceived] = useState("");
  const [comandaId, setComandaId] = useState<string | null>(null);
  const [comandaLabel, setComandaLabel] = useState("");
  const [search, setSearch] = useState("");
  const [codeInput, setCodeInput] = useState("");

  useEffect(() => {
    fetch("/api/products?active=true")
      .then((r) => r.json())
      .then(setProducts);

    const cid = new URLSearchParams(window.location.search).get("comanda");
    if (cid) loadComanda(cid);
  }, []);

  async function loadComanda(id: string) {
    const c = await fetch(`/api/comandas/${id}`).then((r) => r.json());
    if (!c?.id) return;
    setComandaId(id);
    setComandaLabel(c.label);
    setCart(c.items.map((i: any) => ({
      id: i.productId, name: i.product.name, salePrice: i.unitPrice, internalCode: i.product.internalCode,
      unit: i.product.unit, cost: 0, qty: i.qty,
    })));
  }

  function addToCart(product: Product, addQty = 1) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: round3(i.qty + addQty) } : i);
      return [...prev, { ...product, qty: addQty }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) return removeFromCart(id);
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
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
      addToCart(p, weight);
    } else {
      if (weight !== null) return toast.error(`${p.name} não é vendido por peso`);
      addToCart(p, 1);
    }
  }

  function handleCodeKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    if (!codeInput.trim()) return;
    addByCode(codeInput);
    setCodeInput("");
  }

  const filteredProducts = search.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()))
    : products;

  const subtotal = cart.reduce((s, i) => s + i.salePrice * i.qty, 0);
  const total = Math.max(0, subtotal - discount);

  useEffect(() => {
    if (payment === "dinheiro" && cashReceived) {
      setChange(Math.max(0, Number(cashReceived) - total));
    }
  }, [cashReceived, total, payment]);

  async function finalizeSale() {
    if (!cart.length) return toast.error("Adicione produtos ao carrinho");
    setLoading(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({ productId: i.id, qty: i.qty, unitPrice: i.salePrice })),
          paymentMethod: payment,
          discount,
          comandaId,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Venda finalizada! ${formatCurrency(total)}`);
      setCart([]);
      setDiscount(0);
      setCashReceived("");
      setCodeInput("");
      if (comandaId) {
        setComandaId(null);
        setComandaLabel("");
        window.history.replaceState({}, "", "/pdv");
      }
    } catch {
      toast.error("Erro ao finalizar venda");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-muted">
      {/* Catálogo */}
      <div className="flex-1 p-4">
        <h1 className="text-lg font-bold text-foreground mb-4">PDV — Ponto de Venda</h1>
        <input
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          onKeyDown={handleCodeKey}
          placeholder="Código ou peso*código (ex: 0,870*2) — Enter adiciona"
          className="w-full mb-2 px-3 py-2.5 border border-border rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 Buscar produto por nome"
          className="w-full mb-4 px-3 py-2.5 border border-border rounded-xl text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-card rounded-2xl p-4 shadow-sm border border-border text-left active:scale-95 transition-transform hover:border-primary hover:shadow-md"
            >
              <div className="text-3xl mb-2">🥟</div>
              <p className="font-semibold text-foreground text-sm leading-tight">
                {p.name}
                {p.internalCode && <span className="ml-1 text-xs text-subtle">#{p.internalCode}</span>}
              </p>
              {p.category && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block"
                  style={{ backgroundColor: p.category.color + "20", color: p.category.color }}
                >
                  {p.category.name}
                </span>
              )}
              <p className="text-primary font-bold mt-2">{formatCurrency(p.salePrice)}{p.unit === "kg" && <span className="text-xs text-subtle">/kg</span>}</p>
            </button>
          ))}
        </div>
        {filteredProducts.length === 0 && (
          <div className="text-center py-16 text-subtle">
            <p className="text-4xl mb-2">🥟</p>
            {products.length === 0 ? (
              <>
                <p>Nenhum produto cadastrado</p>
                <a href="/produtos" className="text-primary text-sm underline mt-1 inline-block">Cadastrar produtos</a>
              </>
            ) : (
              <p>Nenhum produto encontrado</p>
            )}
          </div>
        )}
      </div>

      {/* Carrinho */}
      <div className="md:w-80 bg-card border-t md:border-t-0 md:border-l border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-bold text-foreground">🛒 Carrinho</h2>
          {comandaId && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary-soft text-primary-soft-foreground font-medium mt-1 inline-block">
              📝 Comanda: {comandaLabel}
            </span>
          )}
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-subtle py-8 text-sm">Toque nos produtos pra adicionar</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-primary">{formatCurrency(item.salePrice)}{item.unit === "kg" && "/kg"}</p>
                </div>
                {item.unit === "kg" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatQty(item.qty)} kg</span>
                    <button onClick={() => removeFromCart(item.id)} className="text-danger text-sm">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      className="w-7 h-7 rounded-lg bg-muted text-muted-foreground font-bold text-base flex items-center justify-center active:bg-muted"
                    >−</button>
                    <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      className="w-7 h-7 rounded-lg bg-primary-soft text-primary-soft-foreground font-bold text-base flex items-center justify-center active:opacity-80"
                    >+</button>
                  </div>
                )}
                <p className="text-sm font-semibold text-foreground w-16 text-right">
                  {formatCurrency(item.salePrice * item.qty)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Pagamento e total */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Desconto */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Desconto R$</span>
            <input
              type="number"
              min={0}
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              placeholder="0,00"
              className="flex-1 border border-border rounded-lg px-2 py-1.5 text-sm text-right"
            />
          </div>

          {/* Pagamento */}
          <div className="grid grid-cols-2 gap-1.5">
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => setPayment(m.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-colors",
                  payment === m.id
                    ? "bg-primary-soft border-primary text-primary-soft-foreground"
                    : "border-border text-muted-foreground"
                )}
              >
                <span>{m.icon}</span> {m.label}
              </button>
            ))}
          </div>

          {/* Troco */}
          {payment === "dinheiro" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Recebeu R$</span>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0,00"
                className="flex-1 border border-border rounded-lg px-2 py-1.5 text-sm text-right"
              />
              {change > 0 && (
                <span className="text-xs text-success font-medium">Troco: {formatCurrency(change)}</span>
              )}
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-bold text-primary">{formatCurrency(total)}</span>
          </div>

          <button
            onClick={finalizeSale}
            disabled={loading || !cart.length}
            className="w-full py-4 bg-primary hover:bg-primary-hover active:bg-primary-hover disabled:opacity-40 text-white font-bold rounded-2xl text-base transition-colors"
          >
            {loading ? "Finalizando..." : "✅ Finalizar Venda"}
          </button>
        </div>
      </div>
    </div>
  );
}
