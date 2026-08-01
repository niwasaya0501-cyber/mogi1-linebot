import OpenAI from "openai";
import { listFaqs } from "@/lib/faq";
import { listMenuItems } from "@/lib/menu";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export type ConfidenceLabel = "高" | "中" | "低";

export type AnswerResult = {
  answer: string;
  confidence: number; // 0-10
  confidenceLabel: ConfidenceLabel;
  isReservationInquiry: boolean;
};

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: buildSystemPrompt(faqContext, menuContext) },
        { role: "user", content: text },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "faq_answer",
          schema: {
            type: "object",
            properties: {
              answer: { type: "string" },
              confidence: { type: "integer", minimum: 0, maximum: 10 },
              is_reservation_inquiry: { type: "boolean" },
            },
            required: ["answer", "confidence", "is_reservation_inquiry"],
            additionalProperties: false,
          },
          strict: true,
        },
      },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) throw new Error("empty response from OpenAI");

    const parsed = JSON.parse(raw) as {
      answer: string;
      confidence: number;
      is_reservation_inquiry: boolean;
    };

    return {
      answer: parsed.answer,
      confidence: parsed.confidence,
      confidenceLabel: toLabel(parsed.confidence),
      isReservationInquiry: parsed.is_reservation_inquiry,
    };
  } catch (error) {
    console.error("[answer] generation failed, falling back to escalation:", error);
    return { answer: "", confidence: 0, confidenceLabel: "低", isReservationInquiry: false };
  }
}
