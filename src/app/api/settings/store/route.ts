import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const store = await db.store.findUnique({
    where: { id: storeId },
    select: { name: true, cmvTarget: true, defaultMarkup: true, taxRate: true, currency: true },
  });

  if (!store) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(store);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const storeId = (session.user as any).storeId;
  const body = await req.json();

  const store = await db.store.update({
    where: { id: storeId },
    data: {
      name: body.name,
      cmvTarget: body.cmvTarget,
      defaultMarkup: body.defaultMarkup,
      taxRate: body.taxRate,
    },
    select: { name: true, cmvTarget: true, defaultMarkup: true, taxRate: true, currency: true },
  });

  return NextResponse.json(store);
}
