-- LINE Botとお客様のやり取りを記録する会話ログ(管理画面の閲覧専用)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  line_user_id text not null,
  display_name text,
  message text not null,
  answer text not null,
  confidence integer,
  confidence_label text,
  is_reservation_inquiry boolean not null default false,
  escalated boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists conversations_created_at_idx on conversations (created_at desc);

-- RLSを有効化し、anon/authenticatedへのポリシーは一切追加しない(=それらのロールからは常に0件)。
-- service_role(サーバー側のみで使用)はRLSを自動的にバイパスするため、ポリシー不要でフルアクセスできる。
alter table conversations enable row level security;
