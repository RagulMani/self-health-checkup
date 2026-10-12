import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Circle,
  ClipboardPlus,
  Droplets,
  Flame,
  HeartPulse,
  Moon,
  Scale,
  Stethoscope,
  Thermometer,
  Waves,
} from "lucide-react";

import { useSession } from "@/components/AuthSessionProvider";
import { TrendChart, ScoreRing, type ChartSeries } from "@/components/health/Charts";
import { AlertList, ScoreBreakdown } from "@/components/health/ScoreBreakdown";
import { useNotifications } from "@/components/layout/NotificationsProvider";
import { EmptyState, ErrorState, LoadingState } from "@/components/layout/PageStates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import {
  bp,
  fmt,
  formatDateTime,
  formatTime12,
  localDate,
  localTime,
  metricDef,
  wellnessTone,
  type TrendMetric,
} from "@/lib/health-format";
import type { DashboardData, TodayReminder } from "@/lib/health-types";
import { cn } from "@/lib/utils";

const RANGES = [7, 30, 90] as const;

const CHART_OPTIONS: { key: string; label: string; metrics: TrendMetric[] }[] = [
  { key: "wellness", label: "Wellness", metrics: ["wellness_score"] },
  { key: "bp", label: "Blood pressure", metrics: ["systolic_bp", "diastolic_bp"] },
  { key: "hr", label: "Heart rate", metrics: ["heart_rate"] },
  { key: "weight", label: "Weight", metrics: ["weight_kg"] },
  { key: "sugar", label: "Blood sugar", metrics: ["blood_sugar_mgdl"] },
  { key: "temp", label: "Temperature", metrics: ["body_temperature_c"] },
  { key: "sleep", label: "Sleep", metrics: ["sleep_hours"] },
  { key: "water", label: "Water", metrics: ["water_intake_liters"] },
  { key: "activity", label: "Activity", metrics: ["activity_minutes"] },
];

const SERIES_COLORS = ["#0D7377", "#14AABF"];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Tile({
  icon,
  label,
  value,
  unit,
  sub,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  unit?: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums">
        {value}
        {value !== "—" && unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function BmiScale({ bmi }: { bmi: number | null }) {
  const min = 15;
  const max = 40;
  const pos = bmi == null ? null : ((Math.min(max, Math.max(min, bmi)) - min) / (max - min)) * 100;
  const segs = [
    { to: 18.5, color: "bg-sky-300", label: "Under" },
    { to: 25, color: "bg-emerald-400", label: "Healthy" },
    { to: 30, color: "bg-amber-400", label: "Over" },
    { to: 40, color: "bg-red-400", label: "Obese" },
  ];
  let prev = min;
  return (
    <div className="mt-4">
      <div className="relative flex h-2 overflow-hidden rounded-full">
        {segs.map((s) => {
          const w = ((s.to - prev) / (max - min)) * 100;
          prev = s.to;
          return <div key={s.label} className={s.color} style={{ width: `${w}%` }} />;
        })}
      </div>
      <div className="relative h-3">
        {pos != null && (
          <div className="absolute -top-3.5 h-5 w-1 -translate-x-1/2 rounded-full bg-foreground ring-2 ring-background" style={{ left: `${pos}%` }} />
        )}
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>Under</span>
        <span>Healthy</span>
        <span>Over</span>
        <span>Obese</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useSession();
  const { refresh: refreshNotifications } = useNotifications();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [data, setData] = useState<DashboardData | null>(null);
  const [today, setToday] = useState<TodayReminder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [chart, setChart] = useState(CHART_OPTIONS[0].key);

  const load = useCallback(async () => {
    setError(null);
    const [dash, rem] = await Promise.all([
      api.get<DashboardData>("/api/dashboard", { query: { days } }),
      api.get<TodayReminder[]>("/api/reminders/today", { query: { date: localDate(), time: localTime() } }),
    ]);
    if (!dash.success) setError(dash.error);
    else setData(dash.data);
    if (rem.success) setToday(rem.data);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleReminder(r: TodayReminder) {
    setToday((prev) => prev.map((x) => (x.id === r.id ? { ...x, completed_today: !x.completed_today } : x)));
    const res = await api.post(`/api/reminders/${r.id}/complete`, { date: localDate(), completed: !r.completed_today });
    if (!res.success) {
      setToday((prev) => prev.map((x) => (x.id === r.id ? { ...x, completed_today: r.completed_today } : x)));
    } else {
      void refreshNotifications();
    }
  }

  const chartSeries = useMemo<ChartSeries[]>(() => {
    if (!data) return [];
    const opt = CHART_OPTIONS.find((o) => o.key === chart) ?? CHART_OPTIONS[0];
    return opt.metrics.map((m, i) => {
      const def = metricDef(m);
      return {
        key: m,
        label: def.label,
        color: SERIES_COLORS[i % SERIES_COLORS.length],
        values: data.trend.map((p) => p[m]),
        decimals: def.decimals,
        unit: def.unit,
      };
    });
  }, [data, chart]);

  if (loading) return <LoadingState label="Loading your dashboard…" />;
  if (error || !data) return <ErrorState message={error ?? "Could not load dashboard."} onRetry={load} />;

  const s = data.snapshot;
  const m = s.metrics;
  const avg = data.averages_7d;
  const firstName = (user?.name || "").split(" ")[0];
  const pending = today.filter((r) => !r.completed_today).length;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}
            {firstName ? `, ${firstName}` : ""}
          </h1>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/symptoms">
              <Stethoscope />
              Check symptoms
            </Link>
          </Button>
          <Button asChild>
            <Link to="/check-in">
              <ClipboardPlus />
              Log check-in
            </Link>
          </Button>
        </div>
      </div>

      {data.total_records === 0 ? (
        <EmptyState
          icon={<HeartPulse className="h-8 w-8" />}
          title="Start with your first check-in"
          description="Log a few measurements like weight, blood pressure or sleep. Your wellness score, BMI and trends will appear here."
          action={
            <Button asChild>
              <Link to="/check-in">Log your first check-in</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="gap-0 py-5">
              <CardContent className="flex items-center gap-5 px-5">
                <ScoreRing score={s.wellness_score} label={s.wellness_label} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">Today's wellness</p>
                  <p className={cn("text-lg font-semibold", wellnessTone(s.wellness_score))}>{s.wellness_label ?? "No recent data"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.as_of ? `Based on readings from ${formatDateTime(s.as_of)}` : "No readings in the last 24 hours"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="gap-0 py-5">
              <CardContent className="px-5">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Scale className="h-4 w-4 text-primary" />
                  Body Mass Index
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-semibold tabular-nums">{fmt(s.bmi, 1)}</span>
                  <span className="text-sm text-muted-foreground">{s.bmi_category ?? "Add height & weight"}</span>
                </div>
                <BmiScale bmi={s.bmi} />
              </CardContent>
            </Card>

            <Card className="gap-0 py-5">
              <CardContent className="grid grid-cols-2 gap-4 px-5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <Flame className="h-3.5 w-3.5 text-amber-500" />
                    Streak
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {data.streak_days}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">day{data.streak_days === 1 ? "" : "s"}</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Check-ins</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{data.total_records}</p>
                </div>
                <div className="col-span-2 border-t pt-3">
                  <p className="text-xs font-medium text-muted-foreground">7-day average score</p>
                  <p className={cn("mt-1 text-2xl font-semibold tabular-nums", wellnessTone(avg.wellness_score))}>
                    {fmt(avg.wellness_score, 0)}
                    <span className="ml-1 text-sm font-normal text-muted-foreground">/ 100</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <AlertList alerts={s.alerts} />

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Tile icon={<HeartPulse className="h-4 w-4" />} label="Blood pressure" value={bp(m.systolic_bp, m.diastolic_bp)} unit="mmHg" sub={`7-day avg ${bp(avg.systolic_bp, avg.diastolic_bp)}`} />
            <Tile icon={<Activity className="h-4 w-4" />} label="Heart rate" value={fmt(m.heart_rate)} unit="bpm" sub={`7-day avg ${fmt(avg.heart_rate)}`} />
            <Tile icon={<Thermometer className="h-4 w-4" />} label="Temperature" value={fmt(m.body_temperature_c, 1)} unit="°C" sub={`7-day avg ${fmt(avg.body_temperature_c, 1)}`} />
            <Tile
              icon={<Waves className="h-4 w-4" />}
              label="Blood sugar"
              value={fmt(m.blood_sugar_mgdl)}
              unit="mg/dL"
              sub={m.blood_sugar_context ? m.blood_sugar_context.replace(/_/g, " ") : `7-day avg ${fmt(avg.blood_sugar_mgdl)}`}
            />
            <Tile icon={<Scale className="h-4 w-4" />} label="Weight" value={fmt(m.weight_kg, 1)} unit="kg" sub={`7-day avg ${fmt(avg.weight_kg, 1)}`} />
            <Tile icon={<Moon className="h-4 w-4" />} label="Sleep" value={fmt(m.sleep_hours, 1)} unit="h" sub="Goal 7–9 h" />
            <Tile icon={<Droplets className="h-4 w-4" />} label="Water" value={fmt(m.water_intake_liters, 1)} unit="L" sub="Goal ~2–3 L" />
            <Tile icon={<Activity className="h-4 w-4" />} label="Activity" value={fmt(m.activity_minutes)} unit="min" sub="Goal 30+ min" />
          </div>

          <Card className="gap-4">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Trends</CardTitle>
                <CardDescription>Daily averages over the last {days} days</CardDescription>
              </div>
              <div className="inline-flex rounded-md border bg-muted p-0.5 text-sm">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDays(r)}
                    className={cn("rounded px-3 py-1 font-medium", days === r ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}
                  >
                    {r}d
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
                {CHART_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    type="button"
                    onClick={() => setChart(o.key)}
                    className={cn(
                      "shrink-0 rounded-full border px-3 py-1 text-xs font-medium",
                      chart === o.key ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              <TrendChart
                labels={data.trend.map((p) => p.date)}
                series={chartSeries}
                emptyText={`No ${CHART_OPTIONS.find((o) => o.key === chart)?.label.toLowerCase()} readings in this period`}
              />
            </CardContent>
          </Card>
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Score breakdown</CardTitle>
            <CardDescription>How each recent reading contributes to your wellness score</CardDescription>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown components={s.components} />
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Today's reminders</CardTitle>
              <CardDescription>
                {today.length === 0 ? "Nothing scheduled today" : pending === 0 ? "All done for today" : `${pending} remaining`}
              </CardDescription>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/reminders">Manage</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {today.length === 0 ? (
              <EmptyState
                icon={<CalendarClock className="h-6 w-6" />}
                title="No reminders today"
                description="Set reminders for check-ins, medication, exercise or water."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link to="/reminders">Add a reminder</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-1">
                {today.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => void toggleReminder(r)}
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted"
                    >
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
      </div>

      <p className="text-center text-xs text-muted-foreground">{data.disclaimer}</p>
    </div>
  );
}
