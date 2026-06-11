import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const config = await db.aiConfig.findUnique({ where: { storeId } });

  if (!config) return NextResponse.json({
    provider: "google", model: "gemini-2.0-flash",
    apiKey: null, ollamaUrl: "http://localhost:11434",
    temperature: 0.7, maxTokens: 1024, active: true,
  });

  // Não retorna a API key completa — retorna masked
  const masked = config.apiKey
    ? `${"*".repeat(Math.max(0, config.apiKey.length - 4))}${config.apiKey.slice(-4)}`
    : null;

  return NextResponse.json({ ...config, apiKey: masked });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const storeId = (session.user as any).storeId;
  const body = await req.json();

  const data: any = {
    provider: body.provider,
    model: body.model,
    temperature: body.temperature ?? 0.7,
    maxTokens: body.maxTokens ?? 1024,
  };

  // Se enviou uma nova apiKey (não masked), salva
  if (body.apiKey && !body.apiKey.startsWith("***")) {
    data.apiKey = body.apiKey;
  }

  if (body.provider === "ollama" && body.ollamaUrl) {
    data.ollamaUrl = body.ollamaUrl;
  }

  const config = await db.aiConfig.upsert({
    where: { storeId },
    create: { storeId, ...data },
    update: data,
  });

  return NextResponse.json({ ...config, apiKey: config.apiKey ? "***salvo***" : null });
}
