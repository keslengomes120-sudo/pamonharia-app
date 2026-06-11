import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const storeId = (session.user as any).storeId;
  const users = await db.user.findMany({
    where: { storeId },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as any).role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const storeId = (session.user as any).storeId;
  const body = await req.json();

  if (!body.name || !body.email || !body.password) {
    return NextResponse.json({ error: "Nome, email e senha obrigatórios" }, { status: 400 });
  }

  const exists = await db.user.findUnique({ where: { email: body.email } });
  if (exists) return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });

  const hashed = await bcrypt.hash(body.password, 10);
  const user = await db.user.create({
    data: {
      storeId,
      name: body.name,
      email: body.email,
      password: hashed,
      role: body.role ?? "operador",
      active: true,
    },
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });

  return NextResponse.json(user, { status: 201 });
}
