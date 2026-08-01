import { getSupabase } from "@/lib/supabase";

export type MenuItem = {
  id: string;
  name: string;
  price: string;
  description: string;
  sortOrder: number;
};

type MenuItemRow = {
  id: string;
  name: string;
  price: string;
  description: string;
  sort_order: number;
};

function fromRow(row: MenuItemRow): MenuItem {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

export async function listMenuItems(): Promise<MenuItem[]> {
  const { data, error } = await getSupabase()
    .from("menu_items")
    .select("id, name, price, description, sort_order")
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return (data as MenuItemRow[]).map(fromRow);
}

export async function createMenuItem(input: {
  name: string;
  price: string;
  description: string;
}): Promise<MenuItem> {
  const { data: existing, error: countError } = await getSupabase()
    .from("menu_items")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1);
  if (countError) throw countError;

  const nextSortOrder = (existing?.[0]?.sort_order ?? 0) + 1;

  const { data, error } = await getSupabase()
    .from("menu_items")
    .insert({
      name: input.name,
      price: input.price,
      description: input.description,
      sort_order: nextSortOrder,
    })
    .select("id, name, price, description, sort_order")
    .single();

  if (error) throw error;
  return fromRow(data as MenuItemRow);
}

export async function updateMenuItem(
  id: string,
  input: { name: string; price: string; description: string }
): Promise<MenuItem> {
  const { data, error } = await getSupabase()
    .from("menu_items")
    .update({
      name: input.name,
      price: input.price,
      description: input.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, name, price, description, sort_order")
    .single();

  if (error) throw error;
  return fromRow(data as MenuItemRow);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const { error } = await getSupabase().from("menu_items").delete().eq("id", id);
  if (error) throw error;
}
