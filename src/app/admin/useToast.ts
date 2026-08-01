"use client";

import { useCallback, useRef, useState } from "react";

export type Toast = { type: "success" | "error"; message: string };

export function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((toast: Toast) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(toast);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  return { toast, showToast };
}
