-- メニュー管理画面から編集するメニュー・料金データ
create table if not exists menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price text not null,
  description text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menu_items_sort_order_idx on menu_items (sort_order);

-- RLSを有効化し、anon/authenticatedへのポリシーは一切追加しない(=それらのロールからは常に0件)。
-- service_role(サーバー側のみで使用)はRLSを自動的にバイパスするため、ポリシー不要でフルアクセスできる。
alter table menu_items enable row level security;
