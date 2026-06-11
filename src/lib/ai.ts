import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createMistral } from "@ai-sdk/mistral";
import { db } from "@/lib/db";
import { startOfDay, startOfMonth } from "@/lib/utils";

export async function getAiModel(storeId: string) {
  const config = await db.aiConfig.findUnique({ where: { storeId } });

  const provider = config?.provider ?? "google";
  const modelId = config?.model ?? "gemini-2.0-flash";
  const apiKey = config?.apiKey ?? undefined;

  switch (provider) {
    case "google": {
      const g = createGoogleGenerativeAI({ apiKey: apiKey ?? process.env.GOOGLE_AI_API_KEY });
      return g(modelId);
    }

    case "anthropic": {
      const a = createAnthropic({ apiKey: apiKey ?? process.env.ANTHROPIC_API_KEY });
      return a(modelId);
    }

    case "openai": {
      const o = createOpenAI({ apiKey: apiKey ?? process.env.OPENAI_API_KEY });
      return o.chat(modelId);
    }

    case "deepseek": {
      const deepseek = createOpenAI({
        baseURL: "https://api.deepseek.com/v1",
        apiKey: apiKey ?? process.env.DEEPSEEK_API_KEY ?? "",
      });
      return deepseek.chat(modelId);
    }

    case "mistral": {
      const m = createMistral({ apiKey: apiKey ?? process.env.MISTRAL_API_KEY });
      return m(modelId);
    }

    default: {
      const g = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
      return g("gemini-2.0-flash");
    }
  }
}

export async function buildStoreContext(storeId: string): Promise<string> {
  const now = new Date();
  const todayStart = startOfDay();
  const monthStart = startOfMonth();

  const [store, salesToday, salesMonth, lowStock, topProducts] =
    await Promise.all([
      db.store.findUnique({ where: { id: storeId } }),

      db.sale.aggregate({
        where: { storeId, status: "concluida", createdAt: { gte: todayStart } },
        _sum: { totalAmount: true, totalCost: true },
        _count: true,
      }),

      db.sale.aggregate({
        where: {
          storeId,
          status: "concluida",
          createdAt: { gte: monthStart },
        },
        _sum: { totalAmount: true, totalCost: true },
        _count: true,
      }),

      db.ingredient.findMany({
        where: { storeId },
        orderBy: { stockQty: "asc" },
        take: 20,
      }).then((items) => items.filter((i) => i.stockQty <= i.minStock).slice(0, 5)),

      db.saleItem.groupBy({
        by: ["productId"],
        where: {
          sale: { storeId, status: "concluida", createdAt: { gte: monthStart } },
        },
        _sum: { subtotal: true, costTotal: true, qty: true },
        orderBy: { _sum: { subtotal: "desc" } },
        take: 5,
      }),
    ]);

  const revenueToday = salesToday._sum.totalAmount ?? 0;
  const costToday = salesToday._sum.totalCost ?? 0;
  const cmvToday = revenueToday ? ((costToday / revenueToday) * 100).toFixed(1) : "0";

  const revenueMonth = salesMonth._sum.totalAmount ?? 0;
  const costMonth = salesMonth._sum.totalCost ?? 0;
  const cmvMonth = revenueMonth ? ((costMonth / revenueMonth) * 100).toFixed(1) : "0";

  const productIds = topProducts.map((p) => p.productId);
  const products = await db.product.findMany({ where: { id: { in: productIds } } });
  const productMap = Object.fromEntries(products.map((p) => [p.id, p.name]));

  const topList = topProducts
    .map((p) => {
      const rev = p._sum.subtotal ?? 0;
      const cost = p._sum.costTotal ?? 0;
      const margin = rev ? (((rev - cost) / rev) * 100).toFixed(0) : "0";
      return `  - ${productMap[p.productId] ?? p.productId}: R$${rev.toFixed(2)} faturado, margem ${margin}%`;
    })
    .join("\n");

  const lowStockList = (lowStock as any[])
    .map((i: any) => `  - ${i.name}: ${i.stockQty} ${i.unit} (mínimo: ${i.minStock})`)
    .join("\n");

  return `
DADOS DA LOJA (atualizado: ${now.toLocaleString("pt-BR")}):
- Nome: ${store?.name}
- Meta de CMV: ${store?.cmvTarget ?? 30}%

HOJE:
- Faturamento: R$ ${revenueToday.toFixed(2)} (${salesToday._count} vendas)
- CMV: ${cmvToday}% ${Number(cmvToday) > (store?.cmvTarget ?? 30) ? "⚠️ ACIMA da meta" : "✅ dentro da meta"}

ESTE MÊS:
- Faturamento: R$ ${revenueMonth.toFixed(2)} (${salesMonth._count} vendas)
- CMV: ${cmvMonth}% ${Number(cmvMonth) > (store?.cmvTarget ?? 30) ? "⚠️ ACIMA da meta" : "✅ dentro da meta"}
- Custo total: R$ ${costMonth.toFixed(2)}
- Lucro bruto estimado: R$ ${(revenueMonth - costMonth).toFixed(2)}

TOP PRODUTOS DO MÊS (por faturamento):
${topList || "  (sem vendas ainda)"}

ALERTAS DE ESTOQUE BAIXO:
${lowStockList || "  (nenhum alerta)"}
`.trim();
}

export async function askAi(
  storeId: string,
  userId: string,
  message: string
): Promise<string> {
  const [model, context] = await Promise.all([
    getAiModel(storeId),
    buildStoreContext(storeId),
  ]);

  const config = await db.aiConfig.findUnique({ where: { storeId } });

  const system = `Você é o assistente inteligente desta loja de pamonhas.
Responda de forma direta, amigável e em português brasileiro.
Use linguagem simples — o dono da loja não é técnico.
Quando citar valores, use formato R$ XX,XX.
Quando a resposta envolver análise dos dados, cite os números que embasam sua resposta.
Se não souber algo, diga claramente.

${context}`;

  const { text } = await generateText({
    model: model as any,
    system,
    prompt: message,
    maxOutputTokens: config?.maxTokens ?? 1024,
    temperature: config?.temperature ?? 0.7,
  });

  await db.aiChat.create({
    data: {
      storeId,
      userId,
      message,
      response: text,
      provider: config?.provider ?? "google",
      model: config?.model ?? "gemini-2.0-flash",
    },
  });

  return text;
}
