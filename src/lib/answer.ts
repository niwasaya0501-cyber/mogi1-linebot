import { generateText, Output } from "ai";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { listFaqs } from "@/lib/faq";
import { listMenuItems } from "@/lib/menu";

export type ConfidenceLabel = "高" | "中" | "低";

export type AnswerResult = {
  answer: string;
  confidence: number; // 0-10
  confidenceLabel: ConfidenceLabel;
  isReservationInquiry: boolean;
};

// 導入時に環境変数 AI_PROVIDER で固定する(openai / anthropic / google)。未設定時はopenai。
type AiProvider = "openai" | "anthropic" | "google";

function getModel() {
  const provider = (process.env.AI_PROVIDER ?? "openai") as AiProvider;
  switch (provider) {
    case "anthropic":
      return anthropic("claude-haiku-4-5");
    case "google":
      return google("gemini-2.5-flash-lite");
    default:
      return openai("gpt-4o-mini");
  }
}

// AI_PROVIDERはデプロイ時に固定される値のため、モデルは起動時に一度だけ生成して使い回す
const model = getModel();

const answerSchema = z.object({
  answer: z.string(),
  confidence: z.number().int().min(0).max(10),
  is_reservation_inquiry: z.boolean(),
});

function toLabel(confidence: number): ConfidenceLabel {
  if (confidence >= 8) return "高";
  if (confidence >= 6) return "中";
  return "低";
}

function buildSystemPrompt(faqContext: string, menuContext: string): string {
  return `あなたは美容院のLINE公式アカウントで、お客様からのメッセージに一次対応するアシスタントです。
以下のFAQ情報とメニュー・料金情報だけを根拠にして、丁寧で自然な日本語(です/ます調)で回答を作成してください。ここに書かれていない内容を推測して答えてはいけません。

# FAQ
${faqContext}

# メニュー・料金
${menuContext}

# 出力ルール
- answer: お客様への返信文そのもの。FAQ・メニュー情報に基づいた自然な一文〜数文にする。メニュー名や料金を答える際は登録されている表記のまま伝える。根拠がない場合は「担当者にご確認のうえ、あらためてご連絡いたします」のような一次受付の文にする
- confidence: 0〜10の整数。回答がFAQ・メニュー情報に直接裏付けられているほど高くする。直接該当する記述がない場合は必ず5以下にすること
- is_reservation_inquiry: お客様が予約の可否を聞いている、または予約をしたいという内容であれば true、それ以外は false`;
}

export async function generateAnswer(text: string): Promise<AnswerResult> {
  try {
    const [faqs, menuItems] = await Promise.all([listFaqs(), listMenuItems()]);
    const faqContext = faqs
      .map((f, i) => `${i + 1}. Q: ${f.question}\n   A: ${f.answer}`)
      .join("\n");
    const menuContext = menuItems
      .map((m, i) => `${i + 1}. ${m.name} / ${m.price}${m.description ? ` / ${m.description}` : ""}`)
      .join("\n");

    const { output } = await generateText({
      model,
      instructions: buildSystemPrompt(faqContext, menuContext),
      prompt: text,
      output: Output.object({ schema: answerSchema }),
    });

    return {
      answer: output.answer,
      confidence: output.confidence,
      confidenceLabel: toLabel(output.confidence),
      isReservationInquiry: output.is_reservation_inquiry,
    };
  } catch (error) {
    console.error("[answer] generation failed, falling back to escalation:", error);
    return { answer: "", confidence: 0, confidenceLabel: "低", isReservationInquiry: false };
  }
}
