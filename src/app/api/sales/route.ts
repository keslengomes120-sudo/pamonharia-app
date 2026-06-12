import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { startOfDay, startOfMonth } from "@/lib/utils";
import { getOpenSession } from "@/lib/cash";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const { searchParams } = new URL(req.url);

  const period = searchParams.get("period") ?? "today";
  const from = period === "month" ? startOfMonth() : startOfDay();

  const sales = await db.sale.findMany({
    where: { storeId, createdAt: { gte: from } },
    include: {
      items: { include: { product: true } },
      customer: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const userId = (session.user as any).id;
  const body = await req.json();

  const { items, paymentMethod, discount = 0, customerId, notes, comandaId } = body;

  if (!items?.length) {
    return NextResponse.json({ error: "items required" }, { status: 400 });
  }

  // Carrega os produtos com ficha técnica
  const productIds: string[] = items.map((i: any) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds } },
    include: {
      productIngredients: { include: { ingredient: true } },
    },
  });

  const productMap = Object.fromEntries(products.map((p) => [p.id, p]));

  let totalAmount = 0;
  let totalCost = 0;

  const saleItems = items.map((item: any) => {
    const product = productMap[item.productId];
    const unitPrice = item.unitPrice ?? product.salePrice;
    const unitCost =
      product.tipo === "revenda"
        ? product.purchasePrice
        : product.productIngredients.reduce(
            (s: number, pi: any) => s + pi.qtyPerUnit * pi.ingredient.costPerUnit,
            0
          );
    const subtotal = unitPrice * item.qty;
    const costTotal = unitCost * item.qty;
    totalAmount += subtotal;
    totalCost += costTotal;
    return { productId: item.productId, qty: item.qty, unitPrice, unitCost, subtotal, costTotal };
  });

  totalAmount = Math.max(0, totalAmount - discount);
  const cmvPct = totalAmount ? (totalCost / totalAmount) * 100 : 0;

  const openSession = await getOpenSession(storeId);

  // Cria venda + itens + baixa estoque — tudo em transação atômica
  const sale = await db.$transaction(async (tx) => {
    const s = await tx.sale.create({
      data: {
        storeId,
        userId,
        customerId: customerId ?? null,
        cashSessionId: openSession?.id ?? null,
        totalAmount,
        totalCost,
        cmvPct,
        discount,
        paymentMethod,
        notes,
        items: { create: saleItems },
      },
      include: { items: { include: { product: true } } },
    });

    for (const item of saleItems) {
      const product = productMap[item.productId];
      if (product.tipoProducao === "unitario") {
        for (const pi of product.productIngredients) {
          await tx.ingredient.update({
            where: { id: pi.ingredientId },
            data: { stockQty: { decrement: pi.qtyPerUnit * item.qty } },
          });
          await tx.stockMovement.create({
            data: {
              ingredientId: pi.ingredientId,
              userId,
              type: "saida_venda",
              qty: pi.qtyPerUnit * item.qty,
              unitCost: pi.ingredient.costPerUnit,
            },
          });
        }
      }
    }

    if (comandaId) {
      await tx.comanda.update({
        where: { id: comandaId },
        data: { status: "finalizada", closedAt: new Date() },
      });
    }

    return s;
  });

  return NextResponse.json(sale, { status: 201 });
}
