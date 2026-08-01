import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/adminAuth";
import { broadcastText } from "@/lib/line";
import { listBroadcasts, logBroadcast } from "@/lib/broadcasts";

async function requireSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidSessionToken(token);
}

export async function GET() {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const broadcasts = await listBroadcasts();
  return NextResponse.json({ broadcasts });
}

export async function POST(req: NextRequest) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { message } = (await req.json()) as { message?: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "配信するメッセージを入力してください" }, { status: 400 });
  }

  const result = await broadcastText(message.trim());
  if (!result.ok) {
    return NextResponse.json({ error: "LINEへの配信に失敗しました" }, { status: 502 });
  }

  await logBroadcast(message.trim());
  return NextResponse.json({ status: "ok" }, { status: 201 });
}
