import { AlertTriangle, ShieldAlert } from "lucide-react";

import { STATUS_STYLES } from "@/lib/health-format";
import type { HealthAlert, ScoreComponent } from "@/lib/health-types";
import { cn } from "@/lib/utils";

export function ScoreBreakdown({ components }: { components: ScoreComponent[] }) {
  if (components.length === 0) {
    return <p className="text-sm text-muted-foreground">Log a check-in to see how each measurement contributes to your score.</p>;
  }
  return (
    <ul className="grid gap-3">
      {components.map((c) => {
        const s = STATUS_STYLES[c.status];
        return (
          <li key={c.metric} className="grid gap-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium">
                <span className={cn("h-2 w-2 rounded-full", s.dot)} />
                {c.label}
              </span>
              <span className={cn("rounded px-1.5 py-0.5 text-xs font-medium", s.bg, s.text)}>{s.label}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", s.dot)} style={{ width: `${Math.max(4, Math.min(100, c.score))}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{c.message}</p>
          </li>
        );
      })}
    </ul>
  );
}

export function AlertList({ alerts }: { alerts: HealthAlert[] }) {
  if (alerts.length === 0) return null;
  const hasAlert = alerts.some((a) => a.level === "alert");
  return (
    <div className={cn("rounded-lg border p-4", hasAlert ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50")} role="alert">
      <div className={cn("mb-2 flex items-center gap-2 text-sm font-semibold", hasAlert ? "text-red-800" : "text-amber-800")}>
        {hasAlert ? <ShieldAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
        {hasAlert ? "Some readings need attention" : "A few readings to keep an eye on"}
      </div>
      <ul className="grid gap-1.5">
        {alerts.map((a, i) => (
          <li key={a.metric + i} className={cn("flex gap-2 text-sm", a.level === "alert" ? "text-red-800" : "text-amber-900")}>
            <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", a.level === "alert" ? "bg-red-500" : "bg-amber-500")} />
            {a.message}
          </li>
        ))}
      </ul>
      {hasAlert && (
        <p className="mt-3 text-xs text-red-800">
          If you feel unwell — chest pain, trouble breathing, confusion or fainting — seek emergency care immediately.
        </p>
      )}
    </div>
  );
}
