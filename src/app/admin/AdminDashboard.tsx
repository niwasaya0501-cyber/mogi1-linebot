"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/admin/admin.module.css";
import FaqAdmin from "@/app/admin/FaqAdmin";
import MenuAdmin from "@/app/admin/MenuAdmin";
import ConversationLog from "@/app/admin/ConversationLog";
import BroadcastAdmin from "@/app/admin/BroadcastAdmin";

type Tab = "faq" | "menu" | "conversations" | "broadcast";

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("menu");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>管理画面</h1>
          <button
            type="button"
            className={styles.buttonSecondary}
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut && <span className={styles.spinnerDark} aria-hidden="true" />}
            ログアウト
          </button>
        </div>

        <a
          href="https://niwasaya0501-cyber.github.io/mogi1-linebot/manual.html"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.helpLink}
        >
          📖 使い方マニュアルを見る
        </a>

        <div className={styles.tabRow} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "menu"}
            className={tab === "menu" ? styles.tabButtonActive : styles.tabButton}
            onClick={() => setTab("menu")}
          >
            メニュー・料金
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "faq"}
            className={tab === "faq" ? styles.tabButtonActive : styles.tabButton}
            onClick={() => setTab("faq")}
          >
            FAQ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "conversations"}
            className={tab === "conversations" ? styles.tabButtonActive : styles.tabButton}
            onClick={() => setTab("conversations")}
          >
            会話ログ
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "broadcast"}
            className={tab === "broadcast" ? styles.tabButtonActive : styles.tabButton}
            onClick={() => setTab("broadcast")}
          >
            一斉お知らせ配信
          </button>
        </div>

        {tab === "menu" && <MenuAdmin />}
        {tab === "faq" && <FaqAdmin />}
        {tab === "conversations" && <ConversationLog />}
        {tab === "broadcast" && <BroadcastAdmin />}
      </div>
    </div>
  );
}
