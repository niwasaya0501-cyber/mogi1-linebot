import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { listConversations } from "@/lib/conversations";

export async function GET(req: NextRequest) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const before = req.nextUrl.searchParams.get("before") ?? undefined;
  const conversations = await listConversations({ before, limit: 30 });
  return NextResponse.json({ conversations });
}
