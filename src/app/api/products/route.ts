import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const { searchParams } = new URL(req.url);
  const active = searchParams.get("active");

  const products = await db.product.findMany({
    where: {
      storeId,
      ...(active !== null ? { active: active === "true" } : {}),
    },
    include: {
      category: true,
      productIngredients: { include: { ingredient: true } },
    },
    orderBy: { name: "asc" },
  });

  const withCost = products.map((p) => {
    const cost = p.productIngredients.reduce(
      (s, pi) => s + pi.qtyPerUnit * pi.ingredient.costPerUnit,
      0
    );
    const margin = p.salePrice ? ((p.salePrice - cost) / p.salePrice) * 100 : 0;
    return { ...p, cost, margin };
  });

  return NextResponse.json(withCost);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const body = await req.json();

  const product = await db.product.create({
    data: {
      storeId,
      name: body.name,
      categoryId: body.categoryId ?? null,
      unit: body.unit ?? "un",
      salePrice: body.salePrice ?? 0,
      tipoProducao: body.tipoProducao ?? "unitario",
      active: true,
    },
  });

  if (Array.isArray(body.ingredients) && body.ingredients.length > 0) {
    await db.productIngredient.createMany({
      data: body.ingredients
        .filter((i: { ingredientId: string; qtyPerUnit: number }) => i.ingredientId)
        .map((i: { ingredientId: string; qtyPerUnit: number }) => ({
          productId: product.id,
          ingredientId: i.ingredientId,
          qtyPerUnit: i.qtyPerUnit,
        })),
    });
  }

  return NextResponse.json(product, { status: 201 });
}
