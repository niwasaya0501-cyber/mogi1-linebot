import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { generateAnswer } from "@/lib/answer";
import { RESERVATION_REPLY, ESCALATION_HOLDING_REPLY } from "@/lib/faq";
import { replyText, pushText, getProfile } from "@/lib/line";
import { logConversation } from "@/lib/conversations";

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
  const userId = event.source?.userId;
  if (!replyToken) return;

  // オーナーのuserIdを控える際に使う(LINE_OWNER_USER_ID未設定時のデバッグ用)
  console.log("[webhook] from userId:", userId, "text:", text);

  const [result, profile] = await Promise.all([
    generateAnswer(text),
    userId ? getProfile(userId) : Promise.resolve(null),
  ]);
  console.log(
    "[webhook] confidence:",
    result.confidenceLabel,
    `(${result.confidence}/10)`,
    "reservation:",
    result.isReservationInquiry
  );

  let replyMessage: string;
  let escalated = false;
  let ownerNotification: { text: string; label: string } | null = null;

  if (result.isReservationInquiry) {
    replyMessage = RESERVATION_REPLY;
    ownerNotification = { text, label: "予約の問い合わせ" };
  } else if (result.confidence <= 5) {
    replyMessage = ESCALATION_HOLDING_REPLY;
    escalated = true;
    ownerNotification = {
      text: `${text}\n\nAIの回答案: ${result.answer || "(生成なし)"}`,
      label: `AIが回答できなかった質問（確信度: ${result.confidenceLabel} ${result.confidence}/10）`,
    };
  } else {
    replyMessage = result.answer;
  }

  // 返信・オーナー通知・会話ログ保存はそれぞれ独立しているので並列に実行する
  await Promise.all([
    replyText(replyToken, replyMessage),
    ownerNotification ? notifyOwner(ownerNotification.text, ownerNotification.label) : null,
    userId
      ? logConversation({
          lineUserId: userId,
          displayName: profile?.displayName ?? null,
          message: text,
          answer: replyMessage,
          confidence: result.confidence,
          confidenceLabel: result.confidenceLabel,
          isReservationInquiry: result.isReservationInquiry,
          escalated,
        })
      : null,
  ]);
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
