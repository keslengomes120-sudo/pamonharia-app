import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, isUniqueCodeError } from "@/lib/db";

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

  const cost =
    product.tipo === "revenda"
      ? product.purchasePrice
      : product.productIngredients.reduce(
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

  const tipo = body.tipo === "revenda" ? "revenda" : "fabricacao";
  const internalCode = body.internalCode?.trim() || null;

  let product;
  try {
    product = await db.product.update({
      where: { id },
      data: {
        name: body.name,
        internalCode,
        categoryId: body.categoryId ?? null,
        unit: body.unit,
        tipo,
        purchasePrice: tipo === "revenda" ? body.purchasePrice ?? 0 : 0,
        salePrice: body.salePrice,
        tipoProducao: body.tipoProducao,
        active: body.active,
      },
    });
  } catch (e: unknown) {
    if (isUniqueCodeError(e)) {
      return NextResponse.json({ error: "Código interno já usado" }, { status: 409 });
    }
    throw e;
  }

  // Ficha técnica só existe em fabricação própria
  await db.productIngredient.deleteMany({ where: { productId: id } });
  if (tipo === "fabricacao" && Array.isArray(body.ingredients) && body.ingredients.length > 0) {
    await db.productIngredient.createMany({
      data: body.ingredients.map((i: { ingredientId: string; qtyPerUnit: number }) => ({
        productId: id,
        ingredientId: i.ingredientId,
        qtyPerUnit: i.qtyPerUnit,
      })),
    });
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
