import { NextRequest, NextResponse } from "next/server";
import { listFaqs } from "@/lib/faq";

// SupabaseのFreeプランは1週間DBアクセスがないと自動で一時停止されるため、
// Vercel Cronから3日に1回呼び出して軽いSELECTを発生させる(スケジュールはvercel.json)
export async function GET(req: NextRequest) {
  // Vercel CronはCRON_SECRETを Authorization: Bearer ヘッダーに付けて呼び出す
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await listFaqs();
    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("[keep-alive] supabase query failed:", error);
    return NextResponse.json({ error: "supabase query failed" }, { status: 500 });
  }
}
