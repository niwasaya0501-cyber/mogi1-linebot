# mogi1-linebot

LINE公式アカウント向けのLINE Bot。Next.js（App Router）でWebhookを受け、OpenAIによるFAQ自動応答・エスカレーション・FAQ管理画面を実装したプロジェクト。

詳しい仕様は [`requirements.md`](./requirements.md) を参照。

## 現在の状態

- [x] LINEのWebhookをNext.jsで受け取り、署名検証して応答する基盤
- [x] よくある質問へのAI自動応答（OpenAI + FAQデータをコンテキストに毎回渡して生成）
- [x] AIの確信度が低い質問・予約の問い合わせをオーナーへLINE通知（エスカレーション）
- [x] スマホから更新できる管理画面（メニュー・料金 / FAQ / 会話ログ / 一斉配信、パスワード保護、Supabaseに永続化）
- [x] 友だち全員へのお知らせ一斉配信
- [x] 本番(Vercel)デプロイ

## 運用マニュアル

管理画面のスマホでの使い方（専門用語なし、画面キャプチャ付き）は以下から見られる。

- [GitHub Pages版](https://niwasaya0501-cyber.github.io/mogi1-linebot/manual.html)
- [Claude Artifact版](https://claude.ai/code/artifact/0a171e76-4121-4f73-adb8-da0066c40542)

## セットアップ

```bash
npm install
cp .env.local.example .env.local
```

`.env.local` に以下を設定する。

| 変数名 | 取得場所 |
|---|---|
| `LINE_CHANNEL_SECRET` | LINE Developersコンソール > Messaging API設定 > チャンネルシークレット |
| `LINE_CHANNEL_ACCESS_TOKEN` | 同上 > チャンネルアクセストークン（長期） |
| `LINE_OWNER_USER_ID` | オーナー自身がこの公式アカウントに一度メッセージを送り、サーバーログの `[webhook] from userId:` から取得 |
| `OPENAI_API_KEY` | platform.openai.com > API keys |
| `ADMIN_PASSWORD` | `/admin` 管理画面のログインパスワード（任意に決める） |
| `ADMIN_SESSION_SECRET` | 管理画面セッションCookieの署名用シークレット。`openssl rand -hex 32` などで生成 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `NEXT_PUBLIC_SUPABASE_*` / `POSTGRES_*` | `vercel integration add supabase` で自動発行・`vercel env pull` で取得（下記参照） |

### Supabase（FAQデータの保存先）

Vercel Marketplace経由でSupabaseを連携している。ローカルで環境変数を揃える場合:

```bash
vercel link      # 未リンクの場合
vercel env pull .env.local --yes
```

`faqs` テーブルのスキーマは [`supabase/migrations/20260731_create_faqs.sql`](./supabase/migrations/20260731_create_faqs.sql) を参照。RLSは有効化済みで、`service_role`（サーバー側のみ）がRLSをバイパスしてアクセスする設計。

## ローカルでの動作確認

### Webhook（LINE）

LINEはWebhookを外部からHTTPSで叩くため、ローカル開発時は[ngrok](https://ngrok.com/)などでトンネルを張る。

```bash
# 1. 開発サーバーを起動
npm run dev

# 2. 別ターミナルでトンネルを張る
ngrok http 3000
```

発行された `https://xxxx.ngrok-free.dev` を使い、LINE Developersコンソールの「Messaging API設定」で:

1. Webhook URL に `https://xxxx.ngrok-free.dev/api/webhook` を設定
2. 「検証」を押して成功することを確認
3. 「Webhookの利用」をON
4. 「応答メッセージ」はOFF（デフォルト応答と自動応答が重複するのを防ぐ）

設定後、LINEアプリから対象の公式アカウントにメッセージを送ると、FAQの内容に応じてAIが自動応答する。確信度が低い質問・予約の問い合わせは、`LINE_OWNER_USER_ID`宛にPUSH通知が届く。

※ ngrokの無料URLはプロセスを再起動するたびに変わるため、その都度Webhook URLを更新する必要がある。

### FAQ管理画面

```bash
npm run dev
```

`http://localhost:3000/admin` を開き、`ADMIN_PASSWORD` でログイン。FAQの追加・編集・削除が可能で、保存内容は次のメッセージ応答からすぐ反映される。

## ディレクトリ構成

```
src/app/api/webhook/route.ts     LINEのWebhookエンドポイント（署名検証 + FAQ応答 + エスカレーション振り分け）
src/app/api/admin/               管理画面用API（ログイン/ログアウト、FAQのCRUD）
src/app/admin/                   FAQ管理画面（ログインページ + 一覧・編集UI）
src/lib/faq.ts                   FAQデータアクセス層(Supabase) + 固定文言(予約返信・保留メッセージ)
src/lib/answer.ts                OpenAIでFAQ回答+確信度を生成
src/lib/line.ts                  LINEへの返信(reply)・通知(push)
src/lib/supabase.ts              Supabaseサーバークライアント(service role)
src/lib/adminAuth.ts             管理画面セッションの発行・検証
supabase/migrations/             DBスキーマ
requirements.md                  仕様書
```

## 技術構成

- Next.js（App Router / TypeScript）
- LINE Messaging API（返信・PUSH通知は `https://api.line.me/v2/bot/message/*` を直接呼び出し）
- OpenAI API（`gpt-4o-mini`、構造化出力で回答文+確信度を生成）
- Supabase（Postgres、FAQデータの永続化）
- デプロイ先: Vercel（予定）
