import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/adminAuth";
import { listConversations } from "@/lib/conversations";

async function requireSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidSessionToken(token);
}

export async function GET(req: NextRequest) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const before = req.nextUrl.searchParams.get("before") ?? undefined;
  const conversations = await listConversations({ before, limit: 30 });
  return NextResponse.json({ conversations });
}
