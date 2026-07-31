import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from "@/lib/adminAuth";
import { createFaq, listFaqs } from "@/lib/faq";

async function requireSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return isValidSessionToken(token);
}

export async function GET() {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const faqs = await listFaqs();
  return NextResponse.json({ faqs });
}

export async function POST(req: NextRequest) {
  if (!(await requireSession())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { question, answer } = (await req.json()) as { question?: string; answer?: string };
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: "質問と回答を入力してください" }, { status: 400 });
  }

  const faq = await createFaq({ question: question.trim(), answer: answer.trim() });
  return NextResponse.json({ faq }, { status: 201 });
}
