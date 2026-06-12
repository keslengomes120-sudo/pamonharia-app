import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const comanda = await db.comanda.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true } },
      items: { include: { product: { select: { name: true, salePrice: true, unit: true, internalCode: true } } } },
    },
  });

  if (!comanda) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...comanda, total: comanda.items.reduce((s, i) => s + i.unitPrice * i.qty, 0) });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  if (Array.isArray(body.items)) {
    const productIds = body.items.map((i: { productId: string }) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, salePrice: true },
    });
    const priceMap = Object.fromEntries(products.map((p) => [p.id, p.salePrice]));

    await db.comandaItem.deleteMany({ where: { comandaId: id } });
    const valid = body.items.filter((i: { productId: string; qty: number }) => i.productId && i.qty > 0);
    if (valid.length > 0) {
      await db.comandaItem.createMany({
        data: valid.map((i: { productId: string; qty: number }) => ({
          comandaId: id,
          productId: i.productId,
          qty: i.qty,
          unitPrice: priceMap[i.productId] ?? 0,
        })),
      });
    }
  }

  const comanda = await db.comanda.update({
    where: { id },
    data: {
      ...(body.label !== undefined ? { label: body.label } : {}),
      ...(body.customerId !== undefined ? { customerId: body.customerId } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
  });

  return NextResponse.json(comanda);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.comanda.update({ where: { id }, data: { status: "cancelada", closedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
