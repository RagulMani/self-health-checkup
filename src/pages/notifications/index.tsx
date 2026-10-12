import { useState } from "react";
import { Bell, BellRing, Check, HeartPulse, Info, Trash2 } from "lucide-react";

import { useNotifications } from "@/components/layout/NotificationsProvider";
import { EmptyState, LoadingState, PageHeader } from "@/components/layout/PageStates";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, relativeTime } from "@/lib/health-format";
import type { AppNotification } from "@/lib/health-types";
import { cn } from "@/lib/utils";

const ICONS: Record<AppNotification["notification_type"], typeof Bell> = {
  reminder: BellRing,
  health_alert: HeartPulse,
  system: Info,
};

export default function NotificationsPage() {
  const { items, unreadCount, loaded, markRead, markAllRead, remove } = useNotifications();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const shown = filter === "unread" ? items.filter((n) => !n.is_read) : items;

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader
        title="Notifications"
        description="Reminders and health alerts from your check-ins."
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={() => void markAllRead()}>
              <Check />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <div className="inline-flex w-fit rounded-md border bg-muted p-0.5 text-sm">
        {(["all", "unread"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn("rounded px-3 py-1 font-medium", filter === f ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
          >
            {f === "all" ? "All" : `Unread (${unreadCount})`}
          </button>
        ))}
      </div>

      {!loaded ? (
        <LoadingState />
      ) : shown.length === 0 ? (
        <EmptyState icon={<Bell className="h-7 w-7" />} title={filter === "unread" ? "No unread notifications" : "No notifications yet"} description="Reminders and health alerts will show up here." />
      ) : (
        <Card className="gap-0 py-0">
          <ul className="divide-y">
            {shown.map((n) => {
              const Icon = ICONS[n.notification_type];
              return (
                <li key={n.id} className={cn("flex gap-3 px-4 py-4 sm:px-5", !n.is_read && "bg-accent/40")}>
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      n.notification_type === "health_alert" ? "bg-red-50 text-red-600" : "bg-accent text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground" title={formatDateTime(n.created_at)}>
                      {relativeTime(n.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start">
                    {!n.is_read && (
                      <Button variant="ghost" size="icon" onClick={() => void markRead(n.id)} aria-label="Mark as read">
                        <Check />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => void remove(n.id)} aria-label="Delete notification" className="text-muted-foreground hover:text-destructive">
                      <Trash2 />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
