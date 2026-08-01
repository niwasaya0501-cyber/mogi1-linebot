"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";
import { useToast } from "@/app/admin/useToast";

type Faq = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export default function FaqAdmin() {
  const router = useRouter();
  const [faqs, setFaqs] = useState<Faq[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast, showToast } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const loadFaqs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/faqs");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("failed to load");
      const body = (await res.json()) as { faqs: Faq[] };
      setFaqs(body.faqs);
      setLoadError(null);
    } catch {
      setLoadError("FAQの読み込みに失敗しました。");
    }
  }, [router]);

  useEffect(() => {
    // 初回マウント時にFAQ一覧を取得する。loadFaqsの内部setStateはfetch完了後(await後)にしか
    // 走らないため安全だが、静的解析では判別できずルールが誤検知するためこの行のみ無効化する
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadFaqs();
  }, [loadFaqs]);

  async function handleAdd() {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newQuestion, answer: newAnswer }),
      });
      if (!res.ok) throw new Error("failed");
      const { faq } = (await res.json()) as { faq: Faq };
      setFaqs((prev) => [...(prev ?? []), faq]);
      setNewQuestion("");
      setNewAnswer("");
      showToast({ type: "success", message: "FAQを追加しました" });
    } catch {
      showToast({ type: "error", message: "追加できませんでした。もう一度お試しください。" });
    } finally {
      setIsAdding(false);
    }
  }

  function startEdit(faq: Faq) {
    setEditingId(faq.id);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSave(id: string) {
    if (!editQuestion.trim() || !editAnswer.trim()) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: editQuestion, answer: editAnswer }),
      });
      if (!res.ok) throw new Error("failed");
      const { faq } = (await res.json()) as { faq: Faq };
      setFaqs((prev) => (prev ?? []).map((f) => (f.id === id ? faq : f)));
      setEditingId(null);
      showToast({ type: "success", message: "保存しました" });
    } catch {
      showToast({ type: "error", message: "保存できませんでした。もう一度お試しください。" });
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/faqs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setFaqs((prev) => (prev ?? []).filter((f) => f.id !== id));
      setConfirmingDeleteId(null);
      showToast({ type: "success", message: "削除しました" });
    } catch {
      showToast({ type: "error", message: "削除できませんでした。もう一度お試しください。" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
        <div className={styles.card}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="new-question">
              新しい質問
            </label>
            <input
              id="new-question"
              className={styles.input}
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="例: 学割はありますか？"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="new-answer">
              回答
            </label>
            <textarea
              id="new-answer"
              className={styles.textarea}
              value={newAnswer}
              onChange={(e) => setNewAnswer(e.target.value)}
              placeholder="お客様への回答文を入力してください"
            />
          </div>
          <button
            type="button"
            className={styles.button}
            onClick={handleAdd}
            disabled={isAdding || !newQuestion.trim() || !newAnswer.trim()}
          >
            {isAdding && <span className={styles.spinner} aria-hidden="true" />}
            {isAdding ? "追加中…" : "＋ FAQを追加"}
          </button>
        </div>

        {loadError && (
          <div className={styles.card}>
            <p className={styles.errorText} role="alert">
              ⚠️ {loadError}
            </p>
            <button type="button" className={styles.buttonSecondary} onClick={loadFaqs}>
              再読み込み
            </button>
          </div>
        )}

        {faqs === null && !loadError && <p className={styles.emptyState}>読み込み中…</p>}

        {faqs !== null && faqs.length === 0 && (
          <p className={styles.emptyState}>まだFAQが登録されていません。</p>
        )}

        {faqs?.map((faq) => (
          <div key={faq.id} className={styles.card}>
            {editingId === faq.id ? (
              <div className={styles.faqItem}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`edit-question-${faq.id}`}>
                    質問
                  </label>
                  <input
                    id={`edit-question-${faq.id}`}
                    className={styles.input}
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor={`edit-answer-${faq.id}`}>
                    回答
                  </label>
                  <textarea
                    id={`edit-answer-${faq.id}`}
                    className={styles.textarea}
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                  />
                </div>
                <div className={styles.buttonRow}>
                  <button
                    type="button"
                    className={styles.button}
                    onClick={() => handleSave(faq.id)}
                    disabled={savingId === faq.id || !editQuestion.trim() || !editAnswer.trim()}
                  >
                    {savingId === faq.id && <span className={styles.spinner} aria-hidden="true" />}
                    {savingId === faq.id ? "保存中…" : "保存する"}
                  </button>
                  <button
                    type="button"
                    className={styles.buttonSecondary}
                    onClick={cancelEdit}
                    disabled={savingId === faq.id}
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.faqItem}>
                <div className={styles.faqHeader}>
                  <div>
                    <div className={styles.faqQuestion}>Q. {faq.question}</div>
                    <div className={styles.faqAnswer}>{faq.answer}</div>
                  </div>
                </div>

                {confirmingDeleteId === faq.id ? (
                  <div className={styles.buttonRow}>
                    <span style={{ alignSelf: "center", color: "#c22" }}>
                      ⚠️ 本当に削除しますか？
                    </span>
                    <button
                      type="button"
                      className={styles.buttonDanger}
                      onClick={() => handleDelete(faq.id)}
                      disabled={deletingId === faq.id}
                    >
                      {deletingId === faq.id && (
                        <span className={styles.spinnerDark} aria-hidden="true" />
                      )}
                      {deletingId === faq.id ? "削除中…" : "削除する"}
                    </button>
                    <button
                      type="button"
                      className={styles.buttonSecondary}
                      onClick={() => setConfirmingDeleteId(null)}
                      disabled={deletingId === faq.id}
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <div className={styles.buttonRow}>
                    <button
                      type="button"
                      className={styles.buttonSecondary}
                      onClick={() => startEdit(faq)}
                    >
                      ✏️ 編集
                    </button>
                    <button
                      type="button"
                      className={styles.buttonDanger}
                      onClick={() => setConfirmingDeleteId(faq.id)}
                    >
                      🗑️ 削除
                    </button>
                  </div>
                )}
              </div>
            )}
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
