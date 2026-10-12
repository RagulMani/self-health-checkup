import { useCallback, useEffect, useState } from "react";
import { Download, FileText, Lightbulb, Loader2 } from "lucide-react";

import { TrendChart } from "@/components/health/Charts";
import { AlertList } from "@/components/health/ScoreBreakdown";
import { ErrorState, InlineError, LoadingState, PageHeader } from "@/components/layout/PageStates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { bp, fmt, formatDate, formatDateTime, wellnessTone } from "@/lib/health-format";
import type { HealthReport } from "@/lib/health-types";
import { downloadHealthReport } from "@/lib/report-pdf";
import { cn } from "@/lib/utils";

const PERIODS = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 3 months" },
  { days: 365, label: "Last year" },
];

export default function ReportPage() {
  const [days, setDays] = useState(30);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<HealthReport>("/api/reports/health", { query: { days } });
    if (!res.success) setError(res.error);
    else setReport(res.data);
    setLoading(false);
  }, [days]);

  useEffect(() => {
    void load();
  }, [load]);

  async function download() {
    if (!report) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadHealthReport(report);
    } catch {
      setDownloadError("Could not create the PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  const s = report?.snapshot;
  const a = report?.averages;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Health report"
        description="A printable summary of your health data to keep or share with your care provider."
        actions={
          <Button onClick={() => void download()} disabled={!report || downloading}>
            {downloading ? <Loader2 className="animate-spin" /> : <Download />}
            Download PDF
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => setDays(p.days)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium",
              days === p.days ? "border-primary bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <InlineError message={downloadError} />

      {loading ? (
        <LoadingState label="Preparing your report…" />
      ) : error || !report || !s || !a ? (
        <ErrorState message={error ?? "Could not load report."} onRetry={load} />
      ) : (
        <Card className="gap-0 overflow-hidden py-0">
          <div className="bg-primary px-6 py-5 text-primary-foreground">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-lg font-semibold">
                  <FileText className="h-5 w-5" />
                  Personal Health Report
                </p>
                <p className="text-sm text-white/80">
                  {report.user.name} · {report.user.email}
                </p>
              </div>
              <div className="text-sm text-white/80 sm:text-right">
                <p>
                  {formatDate(report.period.from)} – {formatDate(report.period.to)}
                </p>
                <p className="text-xs">Generated {formatDateTime(report.generated_at)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6">
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{report.disclaimer}</p>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Current wellness score</p>
                <p className={cn("mt-1 text-2xl font-semibold", wellnessTone(s.wellness_score))}>
                  {fmt(s.wellness_score)}
                  <span className="text-sm font-normal text-muted-foreground"> / 100</span>
                </p>
                <p className="text-xs text-muted-foreground">{s.wellness_label ?? "No recent data"}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">BMI</p>
                <p className="mt-1 text-2xl font-semibold">{fmt(s.bmi, 1)}</p>
                <p className="text-xs text-muted-foreground">{s.bmi_category ?? "—"}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs text-muted-foreground">Check-ins in period</p>
                <p className="mt-1 text-2xl font-semibold">{a.record_count}</p>
                <p className="text-xs text-muted-foreground">Average score {fmt(a.wellness_score)}</p>
              </div>
            </div>

            <AlertList alerts={s.alerts} />

            {report.insights.length > 0 && (
              <section>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Insights
                </h3>
                <ul className="grid gap-1.5 text-sm">
                  {report.insights.map((i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {i}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section>
              <h3 className="mb-2 text-sm font-semibold">Metrics</h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium">Metric</th>
                      <th className="px-4 py-2 font-medium">Latest</th>
                      <th className="px-4 py-2 font-medium">Period average</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Weight (kg)", fmt(s.metrics.weight_kg, 1), fmt(a.weight_kg, 1)],
                      ["Blood pressure (mmHg)", bp(s.metrics.systolic_bp, s.metrics.diastolic_bp), bp(a.systolic_bp, a.diastolic_bp)],
                      ["Heart rate (bpm)", fmt(s.metrics.heart_rate), fmt(a.heart_rate)],
                      ["Temperature (°C)", fmt(s.metrics.body_temperature_c, 1), fmt(a.body_temperature_c, 1)],
                      ["Blood sugar (mg/dL)", fmt(s.metrics.blood_sugar_mgdl), fmt(a.blood_sugar_mgdl)],
                      ["Sleep (h)", fmt(s.metrics.sleep_hours, 1), fmt(a.sleep_hours, 1)],
                      ["Water (L)", fmt(s.metrics.water_intake_liters, 1), fmt(a.water_intake_liters, 1)],
                      ["Activity (min)", fmt(s.metrics.activity_minutes), fmt(a.activity_minutes)],
                    ].map(([k, l, avg]) => (
                      <tr key={k} className="border-t">
                        <td className="px-4 py-2 font-medium">{k}</td>
                        <td className="px-4 py-2 tabular-nums">{l}</td>
                        <td className="px-4 py-2 tabular-nums">{avg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold">Wellness trend</h3>
              <TrendChart
                labels={report.trend.map((t) => t.date)}
                series={[{ key: "w", label: "Wellness", color: "#0D7377", values: report.trend.map((t) => t.wellness_score), decimals: 0, unit: "/100" }]}
                height={180}
              />
            </section>

            <div className="grid gap-4 sm:grid-cols-2">
              <section className="rounded-lg border p-4 text-sm">
                <h3 className="mb-2 font-semibold">Profile</h3>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
                  <dt className="text-muted-foreground">Age</dt>
                  <dd>{fmt(report.profile.age)}</dd>
                  <dt className="text-muted-foreground">Blood type</dt>
                  <dd>{report.profile.blood_type ?? "—"}</dd>
                  <dt className="text-muted-foreground">Conditions</dt>
                  <dd>{report.profile.medical_conditions || "None recorded"}</dd>
                  <dt className="text-muted-foreground">Allergies</dt>
                  <dd>{report.profile.allergies || "None recorded"}</dd>
                  <dt className="text-muted-foreground">Medications</dt>
                  <dd>{report.profile.current_medications || "None recorded"}</dd>
                </dl>
              </section>
              <section className="rounded-lg border p-4 text-sm">
                <h3 className="mb-2 font-semibold">Included in PDF</h3>
                <ul className="grid gap-1 text-muted-foreground">
                  <li>{report.records.length} check-in records</li>
                  <li>{report.symptom_checks.length} symptom checks</li>
                  <li>Profile, metrics table, alerts and insights</li>
                </ul>
              </section>
            </div>

            <CardHeader className="px-0">
              <CardTitle className="text-sm">Ready to share?</CardTitle>
              <CardDescription>Download the PDF and bring it to your next appointment.</CardDescription>
            </CardHeader>
            <CardContent className="-mt-4 px-0">
              <Button onClick={() => void download()} disabled={downloading}>
                {downloading ? <Loader2 className="animate-spin" /> : <Download />}
                Download PDF
              </Button>
            </CardContent>
          </div>
        </Card>
      )}
    </div>
  );
}
