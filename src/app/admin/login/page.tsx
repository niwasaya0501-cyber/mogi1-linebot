"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "ログインできませんでした。もう一度お試しください。");
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("通信エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <h1 className={styles.loginTitle}>FAQ管理画面</h1>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
            />
          </div>
          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className={styles.button}
            disabled={isSubmitting || !password}
            style={{ width: "100%", marginTop: 12 }}
          >
            {isSubmitting && <span className={styles.spinner} aria-hidden="true" />}
            {isSubmitting ? "確認中…" : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
