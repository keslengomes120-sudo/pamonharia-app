import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAiModel } from "@/lib/ai";
import { generateText } from "ai";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;

  try {
    const model = await getAiModel(storeId);
    const { text } = await generateText({
      model: model as any,
      prompt: "Responda apenas: 'Conexão OK!'",
      maxOutputTokens: 50,
    });
    return NextResponse.json({ reply: text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Erro na IA" }, { status: 500 });
  }
}
