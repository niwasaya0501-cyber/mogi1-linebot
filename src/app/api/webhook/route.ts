import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { generateAnswer } from "@/lib/answer";
import { RESERVATION_REPLY, ESCALATION_HOLDING_REPLY } from "@/lib/faq";
import { replyText, pushText } from "@/lib/line";

const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET;
const OWNER_USER_ID = process.env.LINE_OWNER_USER_ID;

type LineEvent = {
  type: string;
  replyToken?: string;
  message?: { type: string; text?: string };
  source?: { userId?: string };
};

function isValidSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !CHANNEL_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", CHANNEL_SECRET)
    .update(rawBody)
    .digest("base64");
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

async function notifyOwner(text: string, label?: string) {
  if (!OWNER_USER_ID) {
    console.warn("[webhook] LINE_OWNER_USER_ID is not set, skipping owner notification");
    return;
  }
  await pushText(OWNER_USER_ID, label ? `【${label}】\n${text}` : text);
}

async function handleTextMessage(event: LineEvent) {
  const text = event.message?.text ?? "";
  const replyToken = event.replyToken;
  if (!replyToken) return;

  // オーナーのuserIdを控える際に使う(LINE_OWNER_USER_ID未設定時のデバッグ用)
  console.log("[webhook] from userId:", event.source?.userId, "text:", text);

  const result = await generateAnswer(text);
  console.log(
    "[webhook] confidence:",
    result.confidenceLabel,
    `(${result.confidence}/10)`,
    "reservation:",
    result.isReservationInquiry
  );

  if (result.isReservationInquiry) {
    await replyText(replyToken, RESERVATION_REPLY);
    await notifyOwner(text, "予約の問い合わせ");
    return;
  }

  if (result.confidence <= 5) {
    await replyText(replyToken, ESCALATION_HOLDING_REPLY);
    await notifyOwner(
      `${text}\n\nAIの回答案: ${result.answer || "(生成なし)"}`,
      `AIが回答できなかった質問（確信度: ${result.confidenceLabel} ${result.confidence}/10）`
    );
    return;
  }

  await replyText(replyToken, result.answer);
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-line-signature");

  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  const { events } = JSON.parse(rawBody) as { events: LineEvent[] };

  await Promise.all(
    (events ?? []).map((event) => {
      if (event.type === "message" && event.message?.type === "text") {
        return handleTextMessage(event);
      }
      return Promise.resolve();
    })
  );

  return NextResponse.json({ status: "ok" });
}
