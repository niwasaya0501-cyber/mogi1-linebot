-- FAQ管理画面から編集するFAQデータ
create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists faqs_sort_order_idx on faqs (sort_order);

-- RLSを有効化し、anon/authenticatedへのポリシーは一切追加しない(=それらのロールからは常に0件)。
-- service_role(サーバー側のみで使用)はRLSを自動的にバイパスするため、ポリシー不要でフルアクセスできる。
alter table faqs enable row level security;
