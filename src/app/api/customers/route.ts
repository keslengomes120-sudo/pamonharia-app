import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";

  const customers = await db.customer.findMany({
    where: {
      storeId,
      ...(q ? { name: { contains: q } } : {}),
    },
    include: { _count: { select: { sales: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const body = await req.json();

  if (!body.name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const customer = await db.customer.create({
    data: { storeId, name: body.name, phone: body.phone ?? null, notes: body.notes ?? null },
  });

  return NextResponse.json(customer, { status: 201 });
}
