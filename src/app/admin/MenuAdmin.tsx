"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

type MenuItem = {
  id: string;
  name: string;
  price: string;
  description: string;
  sortOrder: number;
};

type Toast = { type: "success" | "error"; message: string };

export default function MenuAdmin() {
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const showToast = useCallback((toast: Toast) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(toast);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const loadMenuItems = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/menu");
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) throw new Error("failed to load");
      const body = (await res.json()) as { menuItems: MenuItem[] };
      setMenuItems(body.menuItems);
      setLoadError(null);
    } catch {
      setLoadError("メニューの読み込みに失敗しました。");
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMenuItems();
  }, [loadMenuItems]);

  async function handleAdd() {
    if (!newName.trim() || !newPrice.trim()) return;
    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, price: newPrice, description: newDescription }),
      });
      if (!res.ok) throw new Error("failed");
      const { menuItem } = (await res.json()) as { menuItem: MenuItem };
      setMenuItems((prev) => [...(prev ?? []), menuItem]);
      setNewName("");
      setNewPrice("");
      setNewDescription("");
      showToast({ type: "success", message: "メニューを追加しました" });
    } catch {
      showToast({ type: "error", message: "追加できませんでした。もう一度お試しください。" });
    } finally {
      setIsAdding(false);
    }
  }

  function startEdit(item: MenuItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPrice(item.price);
    setEditDescription(item.description);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function handleSave(id: string) {
    if (!editName.trim() || !editPrice.trim()) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/admin/menu/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, price: editPrice, description: editDescription }),
      });
      if (!res.ok) throw new Error("failed");
      const { menuItem } = (await res.json()) as { menuItem: MenuItem };
      setMenuItems((prev) => (prev ?? []).map((m) => (m.id === id ? menuItem : m)));
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
      const res = await fetch(`/api/admin/menu/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("failed");
      setMenuItems((prev) => (prev ?? []).filter((m) => m.id !== id));
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
          <label className={styles.label} htmlFor="new-name">
            メニュー名
          </label>
          <input
            id="new-name"
            className={styles.input}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="例: カット"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="new-price">
            価格
          </label>
          <input
            id="new-price"
            className={styles.input}
            value={newPrice}
            onChange={(e) => setNewPrice(e.target.value)}
            placeholder="例: ¥4,500"
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="new-description">
            説明（任意）
          </label>
          <textarea
            id="new-description"
            className={styles.textarea}
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="例: シャンプー・ブロー込み"
          />
        </div>
        <button
          type="button"
          className={styles.button}
          onClick={handleAdd}
          disabled={isAdding || !newName.trim() || !newPrice.trim()}
        >
          {isAdding && <span className={styles.spinner} aria-hidden="true" />}
          {isAdding ? "追加中…" : "＋ メニューを追加"}
        </button>
      </div>

      {loadError && (
        <div className={styles.card}>
          <p className={styles.errorText} role="alert">
            ⚠️ {loadError}
          </p>
          <button type="button" className={styles.buttonSecondary} onClick={loadMenuItems}>
            再読み込み
          </button>
        </div>
      )}

      {menuItems === null && !loadError && <p className={styles.emptyState}>読み込み中…</p>}

      {menuItems !== null && menuItems.length === 0 && (
        <p className={styles.emptyState}>まだメニューが登録されていません。</p>
      )}

      {menuItems?.map((item) => (
        <div key={item.id} className={styles.card}>
          {editingId === item.id ? (
            <div className={styles.faqItem}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`edit-name-${item.id}`}>
                  メニュー名
                </label>
                <input
                  id={`edit-name-${item.id}`}
                  className={styles.input}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`edit-price-${item.id}`}>
                  価格
                </label>
                <input
                  id={`edit-price-${item.id}`}
                  className={styles.input}
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`edit-description-${item.id}`}>
                  説明（任意）
                </label>
                <textarea
                  id={`edit-description-${item.id}`}
                  className={styles.textarea}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                />
              </div>
              <div className={styles.buttonRow}>
                <button
                  type="button"
                  className={styles.button}
                  onClick={() => handleSave(item.id)}
                  disabled={savingId === item.id || !editName.trim() || !editPrice.trim()}
                >
                  {savingId === item.id && <span className={styles.spinner} aria-hidden="true" />}
                  {savingId === item.id ? "保存中…" : "保存する"}
                </button>
                <button
                  type="button"
                  className={styles.buttonSecondary}
                  onClick={cancelEdit}
                  disabled={savingId === item.id}
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.faqItem}>
              <div className={styles.faqHeader}>
                <div>
                  <div className={styles.faqQuestion}>
                    {item.name}　<span className={styles.menuPrice}>{item.price}</span>
                  </div>
                  {item.description && <div className={styles.faqAnswer}>{item.description}</div>}
                </div>
              </div>

              {confirmingDeleteId === item.id ? (
                <div className={styles.buttonRow}>
                  <span style={{ alignSelf: "center", color: "#c22" }}>
                    ⚠️ 本当に削除しますか？
                  </span>
                  <button
                    type="button"
                    className={styles.buttonDanger}
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id && (
                      <span className={styles.spinnerDark} aria-hidden="true" />
                    )}
                    {deletingId === item.id ? "削除中…" : "削除する"}
                  </button>
                  <button
                    type="button"
                    className={styles.buttonSecondary}
                    onClick={() => setConfirmingDeleteId(null)}
                    disabled={deletingId === item.id}
                  >
                    キャンセル
                  </button>
                </div>
              ) : (
                <div className={styles.buttonRow}>
                  <button
                    type="button"
                    className={styles.buttonSecondary}
                    onClick={() => startEdit(item)}
                  >
                    ✏️ 編集
                  </button>
                  <button
                    type="button"
                    className={styles.buttonDanger}
                    onClick={() => setConfirmingDeleteId(item.id)}
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
