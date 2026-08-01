import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/adminAuth";
import { deleteMenuItem, updateMenuItem } from "@/lib/menu";

async function requireSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidSessionToken(token);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { name, price, description } = (await req.json()) as {
    name?: string;
    price?: string;
    description?: string;
  };
  if (!name?.trim() || !price?.trim()) {
    return NextResponse.json({ error: "名前と価格を入力してください" }, { status: 400 });
  }

  const menuItem = await updateMenuItem(id, {
    name: name.trim(),
    price: price.trim(),
    description: description?.trim() ?? "",
  });
  return NextResponse.json({ menuItem });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await deleteMenuItem(id);
  return NextResponse.json({ status: "ok" });
}
