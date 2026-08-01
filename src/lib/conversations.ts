import { getSupabase } from "@/lib/supabase";

export type Conversation = {
  id: string;
  lineUserId: string;
  displayName: string | null;
  message: string;
  answer: string;
  confidence: number | null;
  confidenceLabel: string | null;
  isReservationInquiry: boolean;
  escalated: boolean;
  createdAt: string;
};

type ConversationRow = {
  id: string;
  line_user_id: string;
  display_name: string | null;
  message: string;
  answer: string;
  confidence: number | null;
  confidence_label: string | null;
  is_reservation_inquiry: boolean;
  escalated: boolean;
  created_at: string;
};

function fromRow(row: ConversationRow): Conversation {
  return {
    id: row.id,
    lineUserId: row.line_user_id,
    displayName: row.display_name,
    message: row.message,
    answer: row.answer,
    confidence: row.confidence,
    confidenceLabel: row.confidence_label,
    isReservationInquiry: row.is_reservation_inquiry,
    escalated: row.escalated,
    createdAt: row.created_at,
  };
}

export async function logConversation(input: {
  lineUserId: string;
  displayName: string | null;
  message: string;
  answer: string;
  confidence: number | null;
  confidenceLabel: string | null;
  isReservationInquiry: boolean;
  escalated: boolean;
}): Promise<void> {
  const { error } = await getSupabase().from("conversations").insert({
    line_user_id: input.lineUserId,
    display_name: input.displayName,
    message: input.message,
    answer: input.answer,
    confidence: input.confidence,
    confidence_label: input.confidenceLabel,
    is_reservation_inquiry: input.isReservationInquiry,
    escalated: input.escalated,
  });

  // 会話ログの保存に失敗しても、お客様への返信自体は既に成功しているので落とさない
  if (error) console.error("[conversations] failed to log:", error);
}

export async function listConversations(params: {
  before?: string;
  limit?: number;
}): Promise<Conversation[]> {
  let query = getSupabase()
    .from("conversations")
    .select(
      "id, line_user_id, display_name, message, answer, confidence, confidence_label, is_reservation_inquiry, escalated, created_at"
    )
    .order("created_at", { ascending: false })
    .limit(params.limit ?? 30);

  if (params.before) query = query.lt("created_at", params.before);

  const { data, error } = await query;
  if (error) throw error;
  return (data as ConversationRow[]).map(fromRow);
}
