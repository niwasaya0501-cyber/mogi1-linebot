import { getSupabase } from "@/lib/supabase";

export type Faq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

type FaqRow = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
};

function fromRow(row: FaqRow): Faq {
  return { id: row.id, question: row.question, answer: row.answer, sortOrder: row.sort_order };
}

export async function listFaqs(): Promise<Faq[]> {
  const { data, error } = await getSupabase()
    .from("faqs")
    .select("id, question, answer, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as FaqRow[]).map(fromRow);
}

export async function createFaq(input: { question: string; answer: string }): Promise<Faq> {
  const { data: existing, error: countError } = await getSupabase()
    .from("faqs")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  if (countError) throw countError;

  const nextSortOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await getSupabase()
    .from("faqs")
    .insert({ question: input.question, answer: input.answer, sort_order: nextSortOrder })
    .select("id, question, answer, sort_order")
    .single();

  if (error) throw error;
  return fromRow(data as FaqRow);
}

export async function updateFaq(
  id: string,
  input: { question: string; answer: string }
): Promise<Faq> {
  const { data, error } = await getSupabase()
    .from("faqs")
    .update({
      question: input.question,
      answer: input.answer,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, question, answer, sort_order")
    .single();

  if (error) throw error;
  return fromRow(data as FaqRow);
}

export async function deleteFaq(id: string): Promise<void> {
  const { error } = await getSupabase().from("faqs").delete().eq("id", id);
  if (error) throw error;
}

export const RESERVATION_REPLY =
  "メッセージでお返事いたします。ご希望の日時を教えてください。";

export const ESCALATION_HOLDING_REPLY =
  "担当者が確認のうえ、あらためてご連絡いたします。少々お待ちください。";
