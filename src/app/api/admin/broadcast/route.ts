import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { broadcastText } from "@/lib/line";
import { listBroadcasts, logBroadcast } from "@/lib/broadcasts";

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const broadcasts = await listBroadcasts();
  return NextResponse.json({ broadcasts });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { message } = (await req.json()) as { message?: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "配信するメッセージを入力してください" }, { status: 400 });
  }

  const ok = await broadcastText(message.trim());
  if (!ok) {
    return NextResponse.json({ error: "LINEへの配信に失敗しました" }, { status: 502 });
  }

  await logBroadcast(message.trim());
  return NextResponse.json({ status: "ok" }, { status: 201 });
}
