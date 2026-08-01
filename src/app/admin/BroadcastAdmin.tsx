"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

type Broadcast = {
  id: string;
  message: string;
  createdAt: string;
};

type Toast = { type: "success" | "error"; message: string };

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BroadcastAdmin() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [broadcasts, setBroadcasts] = useState<Broadcast[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const showToast = useCallback((toast: Toast) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(toast);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const loadBroadcasts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/broadcast");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("failed to load");
      const body = (await res.json()) as { broadcasts: Broadcast[] };
      setBroadcasts(body.broadcasts);
      setLoadError(null);
    } catch {
      setLoadError("配信履歴の読み込みに失敗しました。");
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadBroadcasts();
  }, [loadBroadcasts]);

  async function handleSend() {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("failed");
      setMessage("");
      setIsConfirming(false);
      showToast({ type: "success", message: "友だち全員に配信しました" });
      void loadBroadcasts();
    } catch {
      showToast({ type: "error", message: "配信できませんでした。もう一度お試しください。" });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      <div className={styles.card}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="broadcast-message">
            配信するお知らせ
          </label>
          <textarea
            id="broadcast-message"
            className={styles.textarea}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="例: 8月のご予約は明日10時より受付開始です"
            disabled={isConfirming}
          />
        </div>

        {isConfirming ? (
          <>
            <p className={styles.errorText} role="alert" style={{ marginBottom: 12 }}>
              ⚠️ 友だち登録している全員に、このメッセージが送信されます。取り消しはできません。本当によろしいですか？
            </p>
            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.buttonDanger}
                onClick={handleSend}
                disabled={isSending}
              >
                {isSending && <span className={styles.spinnerDark} aria-hidden="true" />}
                {isSending ? "配信中…" : "送信する"}
              </button>
              <button
                type="button"
                className={styles.buttonSecondary}
                onClick={() => setIsConfirming(false)}
                disabled={isSending}
              >
                キャンセル
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className={styles.button}
            onClick={() => setIsConfirming(true)}
            disabled={!message.trim()}
          >
            📢 友だち全員に配信する
          </button>
        )}
      </div>

      {loadError && (
        <div className={styles.card}>
          <p className={styles.errorText} role="alert">
            ⚠️ {loadError}
          </p>
          <button type="button" className={styles.buttonSecondary} onClick={loadBroadcasts}>
            再読み込み
          </button>
        </div>
      )}

      {broadcasts === null && !loadError && <p className={styles.emptyState}>読み込み中…</p>}

      {broadcasts !== null && broadcasts.length === 0 && (
        <p className={styles.emptyState}>まだ配信履歴がありません。</p>
      )}

      {broadcasts?.map((b) => (
        <div key={b.id} className={styles.card}>
          <div className={styles.convHeader}>
            <span className={styles.convDate}>{formatDateTime(b.createdAt)} に配信</span>
          </div>
          <div className={styles.faqAnswer}>{b.message}</div>
        </div>
      ))}

      {toast && (
        <div
          className={`${styles.toast} ${toast.type === "error" ? styles.toastError : ""}`}
          role="status"
        >
          <span className={styles.toastIcon} aria-hidden="true">
            {toast.type === "success" ? "✅" : "⚠️"}
          </span>
          {toast.message}
        </div>
      )}
    </>
  );
}
