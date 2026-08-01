import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { createMenuItem, listMenuItems } from "@/lib/menu";

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const menuItems = await listMenuItems();
  return NextResponse.json({ menuItems });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { name, price, description } = (await req.json()) as {
    name?: string;
    price?: string;
    description?: string;
  };
  if (!name?.trim() || !price?.trim()) {
    return NextResponse.json({ error: "名前と価格を入力してください" }, { status: 400 });
  }

  const menuItem = await createMenuItem({
    name: name.trim(),
    price: price.trim(),
    description: description?.trim() ?? "",
  });
  return NextResponse.json({ menuItem }, { status: 201 });
}
