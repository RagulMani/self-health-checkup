import type {
  ComponentStatus,
  Duration,
  ReminderType,
  Severity,
  TrendPoint,
  UrgencyLevel,
  Weekday,
} from "@/lib/health-types";

export const DISCLAIMER_SHORT =
  "For general information only. This app does not provide medical diagnosis or replace professional care. In an emergency, call your local emergency number.";

export type TrendMetric = Exclude<keyof TrendPoint, "date">;

export interface MetricDef {
  key: TrendMetric;
  label: string;
  unit: string;
  decimals: number;
}

export const TREND_METRICS: MetricDef[] = [
  { key: "wellness_score", label: "Wellness score", unit: "/100", decimals: 0 },
  { key: "weight_kg", label: "Weight", unit: "kg", decimals: 1 },
  { key: "bmi", label: "BMI", unit: "", decimals: 1 },
  { key: "systolic_bp", label: "Systolic BP", unit: "mmHg", decimals: 0 },
  { key: "diastolic_bp", label: "Diastolic BP", unit: "mmHg", decimals: 0 },
  { key: "heart_rate", label: "Heart rate", unit: "bpm", decimals: 0 },
  { key: "body_temperature_c", label: "Temperature", unit: "°C", decimals: 1 },
  { key: "blood_sugar_mgdl", label: "Blood sugar", unit: "mg/dL", decimals: 0 },
  { key: "sleep_hours", label: "Sleep", unit: "h", decimals: 1 },
  { key: "water_intake_liters", label: "Water", unit: "L", decimals: 1 },
  { key: "activity_minutes", label: "Activity", unit: "min", decimals: 0 },
];

export function metricDef(key: TrendMetric): MetricDef {
  return TREND_METRICS.find((m) => m.key === key) ?? TREND_METRICS[0];
}

export function fmt(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function bp(sys: number | null | undefined, dia: number | null | undefined): string {
  if (sys == null && dia == null) return "—";
  return `${sys != null ? Math.round(sys) : "—"}/${dia != null ? Math.round(dia) : "—"}`;
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function shortDate(iso: string): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(iso);
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function localDate(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function localTime(d = new Date()): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function toDateTimeLocal(iso: string | null | undefined): string {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  return `${localDate(d)}T${localTime(d)}`;
}

export function formatTime12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${pad(m || 0)} ${suffix}`;
}

export function wellnessTone(score: number | null | undefined): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-primary";
  if (score >= 50) return "text-amber-600";
  return "text-red-600";
}

export function wellnessStroke(score: number | null | undefined): string {
  if (score == null) return "#D1D5DB";
  if (score >= 85) return "#059669";
  if (score >= 70) return "#0D7377";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

export const STATUS_STYLES: Record<ComponentStatus, { dot: string; text: string; bg: string; label: string }> = {
  good: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", label: "Normal" },
  caution: { dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50", label: "Watch" },
  alert: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50", label: "Alert" },
};

export const URGENCY: Record<
  UrgencyLevel,
  { label: string; badge: string; panel: string; accent: string }
> = {
  self_care: {
    label: "Self-care",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    panel: "border-emerald-200 bg-emerald-50",
    accent: "text-emerald-700",
  },
  monitor: {
    label: "Monitor",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    panel: "border-sky-200 bg-sky-50",
    accent: "text-sky-700",
  },
  consult_doctor: {
    label: "See a doctor",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    panel: "border-amber-200 bg-amber-50",
    accent: "text-amber-800",
  },
  urgent_care: {
    label: "Urgent care",
    badge: "bg-orange-50 text-orange-800 border-orange-200",
    panel: "border-orange-300 bg-orange-50",
    accent: "text-orange-800",
  },
  emergency: {
    label: "Emergency",
    badge: "bg-red-50 text-red-700 border-red-200",
    panel: "border-red-300 bg-red-50",
    accent: "text-red-700",
  },
};

export const DURATIONS: { value: Duration; label: string }[] = [
  { value: "less_than_24h", label: "Less than 24 hours" },
  { value: "1_3_days", label: "1–3 days" },
  { value: "4_7_days", label: "4–7 days" },
  { value: "1_2_weeks", label: "1–2 weeks" },
  { value: "more_than_2_weeks", label: "More than 2 weeks" },
];

export const SEVERITIES: { value: Severity; label: string; hint: string }[] = [
  { value: "mild", label: "Mild", hint: "Noticeable, but daily activities are normal" },
  { value: "moderate", label: "Moderate", hint: "Uncomfortable and affects some activities" },
  { value: "severe", label: "Severe", hint: "Very uncomfortable or hard to carry on as usual" },
];

export function durationLabel(value: string): string {
  return DURATIONS.find((d) => d.value === value)?.label ?? value;
}

export const REMINDER_TYPES: { value: ReminderType; label: string }[] = [
  { value: "checkup", label: "Health check-in" },
  { value: "medication", label: "Medication" },
  { value: "exercise", label: "Exercise" },
  { value: "water", label: "Drink water" },
  { value: "other", label: "Other" },
];

export const WEEKDAYS: { value: Weekday; short: string }[] = [
  { value: "sun", short: "Sun" },
  { value: "mon", short: "Mon" },
  { value: "tue", short: "Tue" },
  { value: "wed", short: "Wed" },
  { value: "thu", short: "Thu" },
  { value: "fri", short: "Fri" },
  { value: "sat", short: "Sat" },
];

export function daysLabel(days: Weekday[]): string {
  if (days.length === 0 || days.length === 7) return "Every day";
  const weekdays: Weekday[] = ["mon", "tue", "wed", "thu", "fri"];
  if (days.length === 5 && weekdays.every((d) => days.includes(d))) return "Weekdays";
  if (days.length === 2 && days.includes("sat") && days.includes("sun")) return "Weekends";
  return WEEKDAYS.filter((w) => days.includes(w.value))
    .map((w) => w.short)
    .join(", ");
}

export function errorText(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (typeof err === "string" && err.trim()) return err;
  return fallback;
}
