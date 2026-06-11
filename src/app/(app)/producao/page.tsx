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
        <h1 className="text-xl font-bold text-gray-900">🥟 Custo de Produção</h1>
        <p className="text-sm text-gray-400 mt-1">Selecione um produto para ver o custo de produção por unidade</p>
      </div>

      {/* Seletor de produto */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
        {products.map((p) => (
          <button key={p.id} onClick={() => selectProduct(p)}
            className={`p-3 rounded-2xl border text-left transition-colors ${
              selected?.id === p.id
                ? "border-orange-400 bg-orange-50"
                : "border-gray-100 bg-white hover:border-orange-200 shadow-sm"
            }`}>
            <p className="font-semibold text-sm text-gray-900 leading-tight">{p.name}</p>
            <p className="text-xs text-orange-600 mt-1 font-medium">{formatCurrency(p.salePrice)}</p>
            <p className="text-xs text-gray-400">Custo: {formatCurrency(p.cost)}</p>
          </button>
        ))}
        {products.length === 0 && (
          <div className="col-span-3 text-center py-10 text-gray-300">
            <p>Nenhum produto ativo</p>
            <a href="/produtos" className="text-orange-500 text-xs underline mt-1 block">Cadastrar produtos</a>
          </div>
        )}
      </div>

      {selected && (
        <>
          {/* Ficha técnica */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4">
            <div className="px-5 py-4 border-b border-gray-50">
              <h2 className="font-bold text-gray-900">{selected.name}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Ficha técnica de ingredientes</p>
            </div>
            <div className="divide-y divide-gray-50">
              {selected.productIngredients.length === 0 ? (
                <div className="px-5 py-4 text-sm text-gray-400">
                  Sem ficha técnica cadastrada.{" "}
                  <a href="/produtos" className="text-orange-500 underline">Cadastrar →</a>
                </div>
              ) : selected.productIngredients.map((pi) => {
                const lineCost = pi.qtyPerUnit * pi.ingredient.costPerUnit;
                return (
                  <div key={pi.ingredientId} className="flex items-center px-5 py-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{pi.ingredient.name}</p>
                      <p className="text-xs text-gray-400">
                        {pi.qtyPerUnit} {pi.ingredient.unit} × {formatCurrency(pi.ingredient.costPerUnit)}/{pi.ingredient.unit}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{formatCurrency(lineCost)}</p>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 bg-orange-50 rounded-b-2xl flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">Custo unitário total</span>
              <span className="text-lg font-bold text-orange-600">{formatCurrency(selected.cost)}</span>
            </div>
          </div>

          {/* Simulador de lote */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">🔢 Simular quantidade</h3>
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 rounded-xl bg-gray-100 text-xl font-bold text-gray-700 flex items-center justify-center hover:bg-gray-200">−</button>
              <input type="number" min={1} value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                className="flex-1 text-center text-2xl font-bold py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400" />
              <button onClick={() => setQty(qty + 1)}
                className="w-10 h-10 rounded-xl bg-orange-100 text-xl font-bold text-orange-700 flex items-center justify-center hover:bg-orange-200">+</button>
            </div>

            <div className="space-y-2 text-sm">
              {[10, 25, 50, 100].map((n) => (
                <button key={n} onClick={() => setQty(n)}
                  className="mr-2 px-3 py-1 bg-gray-100 rounded-lg text-xs text-gray-600 hover:bg-orange-100 hover:text-orange-700">
                  {n} un
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-2 border-t border-gray-50 pt-4">
              {[
                { label: "Custo de produção", value: formatCurrency(totalCost), color: "text-red-600" },
                { label: "Receita potencial", value: formatCurrency(totalRevenue), color: "text-green-700" },
                { label: "Lucro bruto", value: formatCurrency(profit), color: profit >= 0 ? "text-blue-700" : "text-red-600" },
                { label: "CMV", value: totalRevenue ? `${((totalCost / totalRevenue) * 100).toFixed(1)}%` : "—", color: (totalRevenue && totalCost / totalRevenue <= 0.3) ? "text-green-700" : "text-amber-600" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between">
                  <span className="text-gray-500">{row.label}</span>
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
