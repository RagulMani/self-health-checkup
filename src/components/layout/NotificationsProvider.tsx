import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { api } from "@/lib/api-client";
import { localDate, localTime } from "@/lib/health-format";
import type { AppNotification } from "@/lib/health-types";

interface NotificationsValue {
  items: AppNotification[];
  unreadCount: number;
  loaded: boolean;
  toast: AppNotification | null;
  dismissToast: () => void;
  refresh: () => Promise<void>;
  checkReminders: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsValue | null>(null);

const POLL_MS = 60_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const seen = useRef<Set<string> | null>(null);

  const refresh = useCallback(async () => {
    const res = await api.get<AppNotification[]>("/api/notifications", { query: { limit: 50 } });
    if (!res.success) return;
    const list = res.data;
    if (seen.current) {
      const fresh = list.find((n) => !n.is_read && !seen.current!.has(n.id));
      if (fresh) setToast(fresh);
    }
    seen.current = new Set(list.map((n) => n.id));
    setItems(list);
    setLoaded(true);
  }, []);

  const checkReminders = useCallback(async () => {
    await api.get("/api/reminders/today", { query: { date: localDate(), time: localTime() } });
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void checkReminders();
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void checkReminders();
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void checkReminders();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [checkReminders]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 8000);
    return () => window.clearTimeout(t);
  }, [toast]);

  const markRead = useCallback(async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await api.post(`/api/notifications/${id}/read`, {});
  }, []);

  const markAllRead = useCallback(async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await api.post("/api/notifications/read-all", {});
  }, []);

  const remove = useCallback(async (id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
    await api.del(`/api/notifications/${id}`);
  }, []);

  const value = useMemo<NotificationsValue>(
    () => ({
      items,
      unreadCount: items.filter((n) => !n.is_read).length,
      loaded,
      toast,
      dismissToast: () => setToast(null),
      refresh,
      checkReminders,
      markRead,
      markAllRead,
      remove,
    }),
    [items, loaded, toast, refresh, checkReminders, markRead, markAllRead, remove]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}
