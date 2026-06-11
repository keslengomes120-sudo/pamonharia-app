import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { askAi } from "@/lib/ai";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const userId = (session.user as any).id;
  const { message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "message required" }, { status: 400 });
  }

  try {
    const reply = await askAi(storeId, userId, message);
    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("[AI Chat Error]", err);
    return NextResponse.json(
      { error: "Erro ao consultar IA. Verifique as configurações de API." },
      { status: 500 }
    );
  }
}
