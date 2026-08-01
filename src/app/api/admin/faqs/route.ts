import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { createFaq, listFaqs } from "@/lib/faq";

export async function GET() {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const faqs = await listFaqs();
  return NextResponse.json({ faqs });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdminSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { question, answer } = (await req.json()) as { question?: string; answer?: string };
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: "質問と回答を入力してください" }, { status: 400 });
  }

  const faq = await createFaq({ question: question.trim(), answer: answer.trim() });
  return NextResponse.json({ faq }, { status: 201 });
}
