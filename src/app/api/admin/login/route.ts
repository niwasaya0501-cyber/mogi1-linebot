import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, createSessionToken, sessionCookieOptions } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password?: string };
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword || password !== adminPassword) {
    return NextResponse.json({ error: "パスワードが違います" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE, createSessionToken(), sessionCookieOptions);

  return NextResponse.json({ status: "ok" });
}
