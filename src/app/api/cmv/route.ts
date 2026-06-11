import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { calcCmvPeriod, cmvByProduct } from "@/lib/cmv";
import { startOfDay, startOfMonth } from "@/lib/utils";
import { db } from "@/lib/db";

function getPeriodRange(period: string): { from: Date; to: Date } {
  const now = new Date();
  if (period === "today") return { from: startOfDay(), to: now };
  if (period === "week") {
    const from = new Date(now); from.setDate(now.getDate() - 6); from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }
  return { from: startOfMonth(), to: now };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const storeId = (session.user as any).storeId;
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") ?? "month";

  const { from, to } = getPeriodRange(period);
  const [periodData, byProduct, store] = await Promise.all([
    calcCmvPeriod(storeId, from, to),
    cmvByProduct(storeId, from, to),
    db.store.findUnique({ where: { id: storeId }, select: { cmvTarget: true } }),
  ]);

  return NextResponse.json({
    period: periodData,
    byProduct,
    target: store?.cmvTarget ?? 30,
  });
}
