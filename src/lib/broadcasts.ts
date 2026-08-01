import { getSupabase } from "@/lib/supabase";

export type Broadcast = {
  id: string;
  message: string;
  createdAt: string;
};

type BroadcastRow = {
  id: string;
  message: string;
  created_at: string;
};

function fromRow(row: BroadcastRow): Broadcast {
  return { id: row.id, message: row.message, createdAt: row.created_at };
}

export async function logBroadcast(message: string): Promise<void> {
  const { error } = await getSupabase().from("broadcasts").insert({ message });
  if (error) throw error;
}

export async function listBroadcasts(): Promise<Broadcast[]> {
  const { data, error } = await getSupabase()
    .from("broadcasts")
    .select("id, message, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data as BroadcastRow[]).map(fromRow);
}
