import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  Circle,
  Droplets,
  Dumbbell,
  Loader2,
  Pencil,
  Pill,
  Plus,
  Stethoscope,
  Trash2,
} from "lucide-react";

import { useNotifications } from "@/components/layout/NotificationsProvider";
import { EmptyState, ErrorState, InlineError, LoadingState, PageHeader } from "@/components/layout/PageStates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { REMINDER_TYPES, WEEKDAYS, daysLabel, formatTime12, localDate, localTime } from "@/lib/health-format";
import type { Reminder, ReminderType, TodayReminder, Weekday } from "@/lib/health-types";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<ReminderType, typeof Pill> = {
  checkup: Stethoscope,
  medication: Pill,
  exercise: Dumbbell,
  water: Droplets,
  other: BellRing,
};

const PRESETS: { title: string; reminder_type: ReminderType; reminder_time: string }[] = [
  { title: "Morning health check-in", reminder_type: "checkup", reminder_time: "08:00" },
  { title: "Take medication", reminder_type: "medication", reminder_time: "09:00" },
  { title: "Drink a glass of water", reminder_type: "water", reminder_time: "11:00" },
  { title: "30-minute walk", reminder_type: "exercise", reminder_time: "18:00" },
];

interface Draft {
  title: string;
  reminder_type: ReminderType;
  reminder_time: string;
  days_of_week: Weekday[];
  notes: string;
  is_active: boolean;
}

const EMPTY: Draft = { title: "", reminder_type: "checkup", reminder_time: "08:00", days_of_week: [], notes: "", is_active: true };

function ReminderForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: Draft;
  onSubmit: (d: Draft) => Promise<string | null>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [d, setD] = useState<Draft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleDay(day: Weekday) {
    setD((p) => ({ ...p, days_of_week: p.days_of_week.includes(day) ? p.days_of_week.filter((x) => x !== day) : [...p.days_of_week, day] }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!d.title.trim()) return setError("Give your reminder a title.");
    setError(null);
    setBusy(true);
    const err = await onSubmit({ ...d, title: d.title.trim() });
    setBusy(false);
    if (err) setError(err);
  }

  const everyDay = d.days_of_week.length === 0 || d.days_of_week.length === 7;

  return (
    <form onSubmit={submit} className="grid gap-4">
      <InlineError message={error} />
      <div className="grid gap-1.5">
        <Label htmlFor="r-title">Title</Label>
        <Input id="r-title" value={d.title} maxLength={120} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="e.g. Take blood pressure pill" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="r-type">Type</Label>
          <NativeSelect id="r-type" value={d.reminder_type} onChange={(e) => setD({ ...d, reminder_type: e.target.value as ReminderType })}>
            {REMINDER_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="r-time">Time</Label>
          <Input id="r-time" type="time" required value={d.reminder_time} onChange={(e) => setD({ ...d, reminder_time: e.target.value })} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <span className="text-sm font-medium">Repeat on</span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setD({ ...d, days_of_week: [] })}
            className={cn("rounded-md border px-3 py-1.5 text-xs font-medium", everyDay ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted")}
          >
            Every day
          </button>
          {WEEKDAYS.map((w) => {
            const on = !everyDay && d.days_of_week.includes(w.value);
            return (
              <button
                key={w.value}
                type="button"
                onClick={() => toggleDay(w.value)}
                aria-pressed={on}
                className={cn("w-11 rounded-md border py-1.5 text-xs font-medium", on ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted")}
              >
                {w.short}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="r-notes">Notes (optional)</Label>
        <Textarea id="r-notes" value={d.notes} maxLength={500} onChange={(e) => setD({ ...d, notes: e.target.value })} placeholder="Dosage, instructions, etc." />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={d.is_active} onChange={(e) => setD({ ...d, is_active: e.target.checked })} className="h-4 w-4 accent-[#0D7377]" />
        Active
      </label>
      <div className="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

export default function RemindersPage() {
  const { refresh } = useNotifications();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [today, setToday] = useState<TodayReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ mode: "create" | "edit"; draft: Draft; id?: string } | null>(null);
  const [deleting, setDeleting] = useState<Reminder | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [all, td] = await Promise.all([
      api.get<Reminder[]>("/api/reminders"),
      api.get<TodayReminder[]>("/api/reminders/today", { query: { date: localDate(), time: localTime() } }),
    ]);
    if (!all.success) setError(all.error);
    else setReminders(all.data);
    if (td.success) setToday(td.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(d: Draft): Promise<string | null> {
    const body = {
      title: d.title,
      reminder_type: d.reminder_type,
      reminder_time: d.reminder_time.slice(0, 5),
      days_of_week: d.days_of_week.length === 7 ? [] : d.days_of_week,
      notes: d.notes.trim() || null,
      is_active: d.is_active,
    };
    const res =
      editor?.mode === "edit" && editor.id
        ? await api.patch<Reminder>(`/api/reminders/${editor.id}`, body)
        : await api.post<Reminder>("/api/reminders", body);
    if (!res.success) return res.error;
    setEditor(null);
    await load();
    return null;
  }

  async function toggleActive(r: Reminder) {
    setReminders((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_active: !x.is_active } : x)));
    const res = await api.patch<Reminder>(`/api/reminders/${r.id}`, { is_active: !r.is_active });
    if (!res.success) setReminders((prev) => prev.map((x) => (x.id === r.id ? r : x)));
    else void load();
  }

  async function toggleDone(r: TodayReminder) {
    setToday((prev) => prev.map((x) => (x.id === r.id ? { ...x, completed_today: !x.completed_today } : x)));
    const res = await api.post(`/api/reminders/${r.id}/complete`, { date: localDate(), completed: !r.completed_today });
    if (!res.success) setToday((prev) => prev.map((x) => (x.id === r.id ? r : x)));
    else void refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const res = await api.del(`/api/reminders/${deleting.id}`);
    if (res.success) {
      setReminders((prev) => prev.filter((r) => r.id !== deleting.id));
      setToday((prev) => prev.filter((r) => r.id !== deleting.id));
    }
    setDeleting(null);
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const done = today.filter((r) => r.completed_today).length;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Reminders"
        description="In-app reminders for check-ins, medication, exercise and water. They appear in your notifications while the app is open."
        actions={
          <Button onClick={() => setEditor({ mode: "create", draft: EMPTY })}>
            <Plus />
            New reminder
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="h-fit gap-4">
          <CardHeader>
            <CardTitle>Today</CardTitle>
            <CardDescription>{today.length === 0 ? "Nothing scheduled" : `${done} of ${today.length} done`}</CardDescription>
          </CardHeader>
          <CardContent>
            {today.length > 0 && (
              <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(done / today.length) * 100}%` }} />
              </div>
            )}
            {today.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active reminders scheduled for today.</p>
            ) : (
              <ul className="grid gap-1">
                {today.map((r) => (
                  <li key={r.id}>
                    <button type="button" onClick={() => void toggleDone(r)} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted">
                      {r.completed_today ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                      ) : (
                        <Circle className={cn("h-5 w-5 shrink-0", r.is_due ? "text-amber-500" : "text-gray-300")} />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm font-medium", r.completed_today && "text-muted-foreground line-through")}>{r.title}</span>
                        <span className="block text-xs text-muted-foreground">
                          {formatTime12(r.reminder_time)}
                          {r.is_due && !r.completed_today ? " · due now" : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader>
            <CardTitle>All reminders</CardTitle>
            <CardDescription>{reminders.length} total</CardDescription>
          </CardHeader>
          <CardContent>
            {reminders.length === 0 ? (
              <div className="grid gap-4">
                <EmptyState icon={<CalendarClock className="h-7 w-7" />} title="No reminders yet" description="Start with one of these, or create your own." />
                <div className="grid gap-2 sm:grid-cols-2">
                  {PRESETS.map((p) => {
                    const Icon = TYPE_ICON[p.reminder_type];
                    return (
                      <button
                        key={p.title}
                        type="button"
                        onClick={() => setEditor({ mode: "create", draft: { ...EMPTY, ...p } })}
                        className="flex items-center gap-3 rounded-md border p-3 text-left hover:bg-muted"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-accent-foreground">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>
                          <span className="block text-sm font-medium">{p.title}</span>
                          <span className="block text-xs text-muted-foreground">Daily at {formatTime12(p.reminder_time)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <ul className="divide-y">
                {reminders.map((r) => {
                  const Icon = TYPE_ICON[r.reminder_type];
                  return (
                    <li key={r.id} className={cn("flex items-center gap-3 py-3", !r.is_active && "opacity-60")}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime12(r.reminder_time)} · {daysLabel(r.days_of_week)}
                          {r.notes ? ` · ${r.notes}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={r.is_active}
                        aria-label={r.is_active ? "Pause reminder" : "Activate reminder"}
                        onClick={() => void toggleActive(r)}
                        className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", r.is_active ? "bg-primary" : "bg-gray-300")}
                      >
                        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", r.is_active ? "left-[18px]" : "left-0.5")} />
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit reminder"
                        onClick={() =>
                          setEditor({
                            mode: "edit",
                            id: r.id,
                            draft: {
                              title: r.title,
                              reminder_type: r.reminder_type,
                              reminder_time: r.reminder_time.slice(0, 5),
                              days_of_week: r.days_of_week,
                              notes: r.notes ?? "",
                              is_active: r.is_active,
                            },
                          })
                        }
                      >
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Delete reminder" onClick={() => setDeleting(r)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={editor != null} onClose={() => setEditor(null)} title={editor?.mode === "edit" ? "Edit reminder" : "New reminder"}>
        {editor && (
          <ReminderForm
            initial={editor.draft}
            onSubmit={save}
            onCancel={() => setEditor(null)}
            submitLabel={editor.mode === "edit" ? "Save changes" : "Create reminder"}
          />
        )}
      </Modal>

      <Modal open={deleting != null} onClose={() => setDeleting(null)} title="Delete reminder?">
        <p className="text-sm text-muted-foreground">
          “{deleting?.title}” will be removed. You can create it again any time.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void confirmDelete()}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
