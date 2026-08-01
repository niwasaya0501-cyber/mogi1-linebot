-- お知らせ一斉配信の送信履歴(管理画面の閲覧専用)
create table if not exists broadcasts (
  id uuid primary key default gen_random_uuid(),
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists broadcasts_created_at_idx on broadcasts (created_at desc);

-- RLSを有効化し、anon/authenticatedへのポリシーは一切追加しない(=それらのロールからは常に0件)。
-- service_role(サーバー側のみで使用)はRLSを自動的にバイパスするため、ポリシー不要でフルアクセスできる。
alter table broadcasts enable row level security;
