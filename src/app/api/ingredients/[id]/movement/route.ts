import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = (session.user as any).id;
  const body = await req.json();

  const { type, qty, unitCost, note } = body;

  const ingredient = await db.ingredient.findUnique({ where: { id } });
  if (!ingredient) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const delta = type === "entrada" || type === "ajuste" ? qty : -qty;
  const newQty = ingredient.stockQty + delta;

  const [movement] = await db.$transaction([
    db.stockMovement.create({
      data: { ingredientId: id, userId, type, qty, unitCost: unitCost ?? ingredient.costPerUnit, note },
    }),
    db.ingredient.update({
      where: { id },
      data: {
        stockQty: Math.max(0, newQty),
        ...(type === "entrada" && unitCost ? { costPerUnit: unitCost } : {}),
      },
    }),
  ]);

  return NextResponse.json(movement, { status: 201 });
}
