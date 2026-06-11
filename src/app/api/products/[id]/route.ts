import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      productIngredients: { include: { ingredient: true } },
    },
  });

  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const cost = product.productIngredients.reduce(
    (s, pi) => s + pi.qtyPerUnit * pi.ingredient.costPerUnit,
    0
  );
  return NextResponse.json({ ...product, cost });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const product = await db.product.update({
    where: { id },
    data: {
      name: body.name,
      categoryId: body.categoryId ?? null,
      unit: body.unit,
      salePrice: body.salePrice,
      tipoProducao: body.tipoProducao,
      active: body.active,
    },
  });

  // Atualiza ficha técnica (ingredientes)
  if (Array.isArray(body.ingredients)) {
    await db.productIngredient.deleteMany({ where: { productId: id } });
    if (body.ingredients.length > 0) {
      await db.productIngredient.createMany({
        data: body.ingredients.map((i: { ingredientId: string; qtyPerUnit: number }) => ({
          productId: id,
          ingredientId: i.ingredientId,
          qtyPerUnit: i.qtyPerUnit,
        })),
      });
    }
  }

  return NextResponse.json(product);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.product.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
