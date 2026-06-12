"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

type Product = {
  id: string; name: string; salePrice: number; cost: number; margin: number;
  tipoProducao: string;
  productIngredients: {
    ingredientId: string; qtyPerUnit: number;
    ingredient: { name: string; unit: string; costPerUnit: number };
  }[];
};

export default function ProducaoPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selected, setSelected] = useState<Product | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    fetch("/api/products?active=true").then((r) => r.json()).then(setProducts);
  }, []);

  const totalCost = selected ? selected.cost * qty : 0;
  const totalRevenue = selected ? selected.salePrice * qty : 0;
  const profit = totalRevenue - totalCost;

  function selectProduct(p: Product) {
    setSelected(p);
    setQty(1);
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-foreground">🥟 Custo de Produção</h1>
        <p className="text-sm text-subtle mt-1">Selecione um produto para ver o custo de produção por unidade</p>
      </div>

      {/* Seletor de produto */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
        {products.map((p) => (
          <button key={p.id} onClick={() => selectProduct(p)}
            className={`p-3 rounded-2xl border text-left transition-colors ${
              selected?.id === p.id
                ? "border-primary bg-primary-soft"
                : "border-border bg-card hover:border-primary shadow-sm"
            }`}>
            <p className="font-semibold text-sm text-foreground leading-tight">{p.name}</p>
            <p className="text-xs text-primary mt-1 font-medium">{formatCurrency(p.salePrice)}</p>
            <p className="text-xs text-subtle">Custo: {formatCurrency(p.cost)}</p>
          </button>
        ))}
        {products.length === 0 && (
          <div className="col-span-3 text-center py-10 text-subtle">
            <p>Nenhum produto ativo</p>
            <a href="/produtos" className="text-primary text-xs underline mt-1 block">Cadastrar produtos</a>
          </div>
        )}
      </div>

      {selected && (
        <>
          {/* Ficha técnica */}
          <div className="bg-card rounded-2xl shadow-sm border border-border mb-4">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-bold text-foreground">{selected.name}</h2>
              <p className="text-xs text-subtle mt-0.5">Ficha técnica de ingredientes</p>
            </div>
            <div className="divide-y divide-border">
              {selected.productIngredients.length === 0 ? (
                <div className="px-5 py-4 text-sm text-subtle">
                  Sem ficha técnica cadastrada.{" "}
                  <a href="/produtos" className="text-primary underline">Cadastrar →</a>
                </div>
              ) : selected.productIngredients.map((pi) => {
                const lineCost = pi.qtyPerUnit * pi.ingredient.costPerUnit;
                return (
                  <div key={pi.ingredientId} className="flex items-center px-5 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{pi.ingredient.name}</p>
                      <p className="text-xs text-subtle">
                        {pi.qtyPerUnit} {pi.ingredient.unit} × {formatCurrency(pi.ingredient.costPerUnit)}/{pi.ingredient.unit}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(lineCost)}</p>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 bg-primary-soft rounded-b-2xl flex justify-between items-center">
              <span className="text-sm font-semibold text-foreground">Custo unitário total</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(selected.cost)}</span>
            </div>
          </div>

          {/* Simulador de lote */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
            <h3 className="font-semibold text-foreground mb-4">🔢 Simular quantidade</h3>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-xl bg-muted text-xl font-bold text-foreground flex items-center justify-center hover:bg-muted">−</button>
              <input type="number" min={1} value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="flex-1 text-center text-2xl font-bold py-2 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-ring" />
              <button onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded-xl bg-primary-soft text-xl font-bold text-primary-soft-foreground flex items-center justify-center hover:opacity-90">+</button>
            </div>

            <div className="space-y-2 text-sm">
              {[10, 25, 50, 100].map((n) => (
                <button key={n} onClick={() => setQty(n)}
                  className="mr-2 px-3 py-1 bg-muted rounded-lg text-xs text-muted-foreground hover:bg-primary-soft hover:text-primary-soft-foreground">
                  {n} un
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-border pt-4">
              {[
                { label: "Custo de produção", value: formatCurrency(totalCost), color: "text-danger" },
                { label: "Receita potencial", value: formatCurrency(totalRevenue), color: "text-success-foreground" },
                { label: "Lucro bruto", value: formatCurrency(profit), color: profit >= 0 ? "text-blue-700" : "text-danger" },
                { label: "CMV", value: totalRevenue ? `${((totalCost / totalRevenue) * 100).toFixed(1)}%` : "—", color: (totalRevenue && totalCost / totalRevenue <= 0.3) ? "text-success-foreground" : "text-warning" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-muted-foreground">{row.label}</span>
                  <span className={`font-semibold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
