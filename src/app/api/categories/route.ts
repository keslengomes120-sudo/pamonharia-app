import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const categories = await db.category.findMany({
    where: { storeId },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const storeId = (session.user as any).storeId;
  const body = await req.json();

  if (!body.name) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });

  const category = await db.category.create({
    data: { storeId, name: body.name, color: body.color ?? "#f97316" },
  });

  return NextResponse.json(category, { status: 201 });
}
