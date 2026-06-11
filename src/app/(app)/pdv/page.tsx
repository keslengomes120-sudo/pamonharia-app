"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCurrency, cn } from "@/lib/utils";

type Product = { id: string; name: string; salePrice: number; category?: { name: string; color: string }; cost: number };
type CartItem = Product & { qty: number };

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

  useEffect(() => {
    fetch("/api/products?active=true")
      .then((r) => r.json())
      .then(setProducts);
  }, []);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) return removeFromCart(id);
    setCart((prev) => prev.map((i) => i.id === id ? { ...i, qty } : i));
  }

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
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Venda finalizada! ${formatCurrency(total)}`);
      setCart([]);
      setDiscount(0);
      setCashReceived("");
    } catch {
      toast.error("Erro ao finalizar venda");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Catálogo */}
      <div className="flex-1 p-4">
        <h1 className="text-lg font-bold text-gray-900 mb-4">PDV — Ponto de Venda</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => addToCart(p)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left active:scale-95 transition-transform hover:border-orange-300 hover:shadow-md"
            >
              <div className="text-3xl mb-2">🥟</div>
              <p className="font-semibold text-gray-900 text-sm leading-tight">{p.name}</p>
              {p.category && (
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium mt-1 inline-block"
                  style={{ backgroundColor: p.category.color + "20", color: p.category.color }}
                >
                  {p.category.name}
                </span>
              )}
              <p className="text-orange-600 font-bold mt-2">{formatCurrency(p.salePrice)}</p>
            </button>
          ))}
        </div>
        {products.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">🥟</p>
            <p>Nenhum produto cadastrado</p>
            <a href="/produtos" className="text-orange-500 text-sm underline mt-1 inline-block">Cadastrar produtos</a>
          </div>
        )}
      </div>

      {/* Carrinho */}
      <div className="md:w-80 bg-white border-t md:border-t-0 md:border-l border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">🛒 Carrinho</h2>
        </div>

        {/* Itens */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {cart.length === 0 ? (
            <p className="text-center text-gray-300 py-8 text-sm">Toque nos produtos pra adicionar</p>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-orange-600">{formatCurrency(item.salePrice)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.id, item.qty - 1)}
                    className="w-7 h-7 rounded-lg bg-gray-100 text-gray-600 font-bold text-base flex items-center justify-center active:bg-gray-200"
                  >−</button>
                  <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                  <button
                    onClick={() => updateQty(item.id, item.qty + 1)}
                    className="w-7 h-7 rounded-lg bg-orange-100 text-orange-700 font-bold text-base flex items-center justify-center active:bg-orange-200"
                  >+</button>
                </div>
                <p className="text-sm font-semibold text-gray-700 w-16 text-right">
                  {formatCurrency(item.salePrice * item.qty)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Pagamento e total */}
        <div className="p-4 border-t border-gray-100 space-y-3">
          {/* Desconto */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Desconto R$</span>
            <input
              type="number"
              min={0}
              value={discount || ""}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              placeholder="0,00"
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right"
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
                    ? "bg-orange-50 border-orange-400 text-orange-700"
                    : "border-gray-200 text-gray-600"
                )}
              >
                <span>{m.icon}</span> {m.label}
              </button>
            ))}
          </div>

          {/* Troco */}
          {payment === "dinheiro" && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Recebeu R$</span>
              <input
                type="number"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder="0,00"
                className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right"
              />
              {change > 0 && (
                <span className="text-xs text-green-600 font-medium">Troco: {formatCurrency(change)}</span>
              )}
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-2xl font-bold text-orange-600">{formatCurrency(total)}</span>
          </div>

          <button
            onClick={finalizeSale}
            disabled={loading || !cart.length}
            className="w-full py-4 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:opacity-40 text-white font-bold rounded-2xl text-base transition-colors"
          >
            {loading ? "Finalizando..." : "✅ Finalizar Venda"}
          </button>
        </div>
      </div>
    </div>
  );
}
