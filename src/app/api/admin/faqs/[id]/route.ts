import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { deleteFaq, updateFaq } from "@/lib/faq";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { question, answer } = (await req.json()) as { question?: string; answer?: string };
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: "質問と回答を入力してください" }, { status: 400 });
  }

  const faq = await updateFaq(id, { question: question.trim(), answer: answer.trim() });
  return NextResponse.json({ faq });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await deleteFaq(id);
  return NextResponse.json({ status: "ok" });
}
