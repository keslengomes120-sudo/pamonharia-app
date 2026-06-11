import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const { id } = await params;
  const body = await req.json();

  const ing = await db.ingredient.findUnique({ where: { id } });
  if (!ing || ing.storeId !== storeId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.ingredient.update({
    where: { id },
    data: {
      name: body.name,
      unit: body.unit,
      costPerUnit: body.costPerUnit,
      stockQty: body.stockQty,
      minStock: body.minStock,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const { id } = await params;
  const ing = await db.ingredient.findUnique({ where: { id } });
  if (!ing || ing.storeId !== storeId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.ingredient.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
