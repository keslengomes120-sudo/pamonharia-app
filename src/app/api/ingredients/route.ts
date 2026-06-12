import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const { searchParams } = new URL(req.url);
  const lowStock = searchParams.get("lowStock") === "true";

  const ingredients = await db.ingredient.findMany({
    where: { storeId },
    orderBy: { name: "asc" },
  });

  const result = ingredients.map((i) => ({
    ...i,
    isLow: i.stockQty <= i.minStock,
    isCritical: i.stockQty <= i.minStock * 0.5,
  }));

  return NextResponse.json(lowStock ? result.filter((i) => i.isLow) : result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const body = await req.json();

  const ingredient = await db.ingredient.create({
    data: {
      storeId,
      name: body.name,
      unit: body.unit ?? "kg",
      stockQty: body.stockQty ?? 0,
      minStock: body.minStock ?? 0,
      costPerUnit: body.costPerUnit ?? 0,
    },
  });

  return NextResponse.json(ingredient, { status: 201 });
}
