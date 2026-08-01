"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";
import { formatDateTime } from "@/lib/format";

type Conversation = {
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

const PAGE_SIZE = 30;

export default function ConversationLog() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const load = useCallback(
    async (before?: string) => {
      try {
        const url = before
          ? `/api/admin/conversations?before=${encodeURIComponent(before)}`
          : "/api/admin/conversations";
        const res = await fetch(url);
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (!res.ok) throw new Error("failed to load");
        const body = (await res.json()) as { conversations: Conversation[] };
        setHasMore(body.conversations.length === PAGE_SIZE);
        setConversations((prev) =>
          before ? [...(prev ?? []), ...body.conversations] : body.conversations
        );
        setLoadError(null);
      } catch {
        setLoadError("会話ログの読み込みに失敗しました。");
      }
    },
    [router]
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  async function handleLoadMore() {
    if (!conversations || conversations.length === 0) return;
    setIsLoadingMore(true);
    try {
      await load(conversations[conversations.length - 1].createdAt);
    } finally {
      setIsLoadingMore(false);
    }
  }

  return (
    <>
      {loadError && (
        <div className={styles.card}>
          <p className={styles.errorText} role="alert">
            ⚠️ {loadError}
          </p>
          <button type="button" className={styles.buttonSecondary} onClick={() => load()}>
            再読み込み
          </button>
        </div>
      )}

      {conversations === null && !loadError && <p className={styles.emptyState}>読み込み中…</p>}

      {conversations !== null && conversations.length === 0 && (
        <p className={styles.emptyState}>まだ会話がありません。</p>
      )}

      {conversations?.map((conv) => (
        <div key={conv.id} className={styles.card}>
          <div className={styles.convHeader}>
            <span className={styles.convUser}>{conv.displayName ?? "（表示名不明なお客様）"}</span>
            <span className={styles.convDate}>{formatDateTime(conv.createdAt)}</span>
          </div>

          <div className={styles.badgeRow}>
            {conv.isReservationInquiry && (
              <span className={styles.badge}>📅 予約の問い合わせ</span>
            )}
            {conv.escalated && (
              <span className={`${styles.badge} ${styles.badgeWarning}`}>⚠️ 要対応</span>
            )}
            {conv.confidenceLabel && (
              <span className={styles.badge}>確信度: {conv.confidenceLabel}</span>
            )}
          </div>

          <div className={styles.convBlock}>
            <div className={styles.convLabel}>お客様</div>
            <div className={styles.faqAnswer}>{conv.message}</div>
          </div>
          <div className={styles.convBlock}>
            <div className={styles.convLabel}>Botの返信</div>
            <div className={styles.faqAnswer}>{conv.answer}</div>
          </div>
        </div>
      ))}

      {conversations !== null && conversations.length > 0 && hasMore && (
        <button
          type="button"
          className={styles.buttonSecondary}
          style={{ width: "100%" }}
          onClick={handleLoadMore}
          disabled={isLoadingMore}
        >
          {isLoadingMore && <span className={styles.spinnerDark} aria-hidden="true" />}
          {isLoadingMore ? "読み込み中…" : "さらに読み込む"}
        </button>
      )}
    </>
  );
}
