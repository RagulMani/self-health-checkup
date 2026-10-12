import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BellRing,
  CalendarClock,
  ClipboardPlus,
  FileDown,
  HeartPulse,
  History,
  Info,
  LayoutDashboard,
  LogOut,
  Menu,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

import { useSession } from "@/components/AuthSessionProvider";
import { NotificationsProvider, useNotifications } from "@/components/layout/NotificationsProvider";
import { DISCLAIMER_SHORT, relativeTime } from "@/lib/health-format";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/check-in", label: "Log check-in", icon: ClipboardPlus },
  { to: "/history", label: "Health history", icon: History },
  { to: "/symptoms", label: "Symptom checker", icon: Stethoscope },
  { to: "/reminders", label: "Reminders", icon: CalendarClock },
  { to: "/report", label: "Health report", icon: FileDown },
  { to: "/profile", label: "Profile", icon: UserRound },
];

export function Brand({ className }: { className?: string }) {
  return (
    <Link to="/dashboard" className={cn("flex items-center gap-2 font-semibold", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <HeartPulse className="h-4 w-4" />
      </span>
      <span className="text-[15px] tracking-tight">Vital Compass</span>
    </Link>
  );
}

export function DisclaimerBanner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 sm:items-center", className)}>
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0" />
      <p>{DISCLAIMER_SHORT}</p>
    </div>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserBlock() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const initials = (user?.name || user?.email || "?")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <div className="flex items-center gap-3 border-t pt-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user?.name || "Your account"}</p>
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          navigate("/login", { replace: true });
        }}
        className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}

function NotificationBell() {
  const { items, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const recent = items.slice(0, 6);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border bg-background shadow-lg">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={() => void markAllRead()} className="text-xs font-medium text-primary hover:underline">
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {recent.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">You're all caught up.</p>
            ) : (
              recent.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (!n.is_read) void markRead(n.id);
                  }}
                  className={cn("flex w-full gap-3 border-b px-4 py-3 text-left last:border-0 hover:bg-muted", !n.is_read && "bg-accent/40")}
                >
                  <span
                    className={cn(
                      "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                      n.is_read ? "bg-transparent" : n.notification_type === "health_alert" ? "bg-red-500" : "bg-primary"
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{n.title}</span>
                    <span className="block text-xs text-muted-foreground">{n.message}</span>
                    <span className="mt-1 block text-[11px] text-muted-foreground">{relativeTime(n.created_at)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate("/notifications");
            }}
            className="w-full border-t px-4 py-2.5 text-center text-sm font-medium text-primary hover:bg-muted"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}

function Toast() {
  const { toast, dismissToast, markRead } = useNotifications();
  if (!toast) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-lg border bg-background p-4 shadow-lg" role="status">
      <div className="flex gap-3">
        <BellRing className={cn("mt-0.5 h-5 w-5 shrink-0", toast.notification_type === "health_alert" ? "text-red-600" : "text-primary")} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">{toast.title}</p>
          <p className="text-sm text-muted-foreground">{toast.message}</p>
          <button
            type="button"
            onClick={() => {
              void markRead(toast.id);
              dismissToast();
            }}
            className="mt-2 text-xs font-medium text-primary hover:underline"
          >
            Mark as read
          </button>
        </div>
        <button type="button" onClick={dismissToast} className="self-start rounded p-1 text-muted-foreground hover:bg-muted" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Shell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-background px-3 py-5 lg:flex">
        <Brand className="mb-6 px-2" />
        <div className="flex-1 overflow-y-auto">
          <NavList />
        </div>
        <UserBlock />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setMobileOpen(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-background px-3 py-5 shadow-lg">
            <div className="mb-6 flex items-center justify-between px-2">
              <Brand />
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavList onNavigate={() => setMobileOpen(false)} />
            </div>
            <UserBlock />
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b bg-background">
          <div className="flex h-14 items-center justify-between gap-2 px-4 sm:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-md p-2 text-muted-foreground hover:bg-muted lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Brand className="lg:hidden" />
            </div>
            <div className="flex items-center gap-1">
              <Link
                to="/check-in"
                className="hidden items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 sm:inline-flex"
              >
                <ClipboardPlus className="h-4 w-4" />
                Log check-in
              </Link>
              <NotificationBell />
            </div>
          </div>
          <DisclaimerBanner />
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
      <Toast />
    </div>
  );
}

export function AppLayout() {
  return (
    <NotificationsProvider>
      <Shell />
    </NotificationsProvider>
  );
}
