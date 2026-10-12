import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardPlus, History, Loader2, Pencil, Trash2 } from "lucide-react";

import { TrendChart, MiniBars } from "@/components/health/Charts";
import { HealthRecordForm } from "@/components/health/HealthRecordForm";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/layout/PageStates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { api } from "@/lib/api-client";
import { bp, fmt, formatDateTime, localDate, wellnessTone } from "@/lib/health-format";
import type { HealthRecord, HealthRecordInput, RecordResult } from "@/lib/health-types";
import { cn } from "@/lib/utils";

const PAGE = 100;

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDate(d);
}

export default function HistoryPage() {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(localDate());
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<HealthRecord | null>(null);
  const [deleting, setDeleting] = useState<HealthRecord | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const query = useMemo(() => {
    const toEnd = new Date(`${to}T23:59:59`);
    return { from: new Date(`${from}T00:00:00`).toISOString(), to: toEnd.toISOString() };
  }, [from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await api.get<HealthRecord[]>("/api/health-records", { query: { ...query, limit: PAGE, offset: 0 } });
    if (!res.success) setError(res.error);
    else {
      setRecords(res.data);
      setHasMore(res.data.length === PAGE);
    }
    setLoading(false);
  }, [query]);

  useEffect(() => {
    void load();
  }, [load]);

  async function loadMore() {
    setLoadingMore(true);
    const res = await api.get<HealthRecord[]>("/api/health-records", { query: { ...query, limit: PAGE, offset: records.length } });
    if (res.success) {
      setRecords((prev) => [...prev, ...res.data]);
      setHasMore(res.data.length === PAGE);
    }
    setLoadingMore(false);
  }

  async function saveEdit(input: HealthRecordInput): Promise<string | null> {
    if (!editing) return null;
    const res = await api.patch<RecordResult>(`/api/health-records/${editing.id}`, input);
    if (!res.success) return res.error;
    setRecords((prev) => prev.map((r) => (r.id === editing.id ? res.data.record : r)));
    setEditing(null);
    return null;
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    const res = await api.del(`/api/health-records/${deleting.id}`);
    setDeleteBusy(false);
    if (res.success) {
      setRecords((prev) => prev.filter((r) => r.id !== deleting.id));
      setDeleting(null);
    }
  }

  const chrono = useMemo(
    () => [...records].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()),
    [records]
  );
  const labels = chrono.map((r) => r.recorded_at);

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Health history"
        description="All of your check-ins, with simple charts to spot patterns."
        actions={
          <Button asChild>
            <Link to="/check-in">
              <ClipboardPlus />
              Log check-in
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-background p-4">
        <div className="grid gap-1.5">
          <Label htmlFor="from">From</Label>
          <Input id="from" type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-9 w-40" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="to">To</Label>
          <Input id="to" type="date" value={to} min={from} max={localDate()} onChange={(e) => setTo(e.target.value)} className="h-9 w-40" />
        </div>
        <div className="flex gap-1.5">
          {[7, 30, 90, 365].map((n) => (
            <Button
              key={n}
              variant="outline"
              size="sm"
              onClick={() => {
                setFrom(daysAgo(n));
                setTo(localDate());
              }}
            >
              {n === 365 ? "1y" : `${n}d`}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : records.length === 0 ? (
        <EmptyState
          icon={<History className="h-8 w-8" />}
          title="No check-ins in this period"
          description="Try a wider date range, or log a new check-in."
          action={
            <Button asChild>
              <Link to="/check-in">Log check-in</Link>
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="gap-4">
              <CardHeader>
                <CardTitle>Wellness score</CardTitle>
                <CardDescription>Score for each check-in</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart
                  labels={labels}
                  series={[{ key: "w", label: "Wellness", color: "#0D7377", values: chrono.map((r) => r.wellness_score), decimals: 0, unit: "/100" }]}
                  height={200}
                  bands={[{ from: 70, to: 100, color: "rgba(16,185,129,0.06)" }]}
                />
              </CardContent>
            </Card>
            <Card className="gap-4">
              <CardHeader>
                <CardTitle>Blood pressure</CardTitle>
                <CardDescription>Systolic and diastolic (mmHg)</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart
                  labels={labels}
                  series={[
                    { key: "s", label: "Systolic", color: "#0D7377", values: chrono.map((r) => r.systolic_bp), decimals: 0, unit: "mmHg" },
                    { key: "d", label: "Diastolic", color: "#14AABF", values: chrono.map((r) => r.diastolic_bp), decimals: 0, unit: "mmHg" },
                  ]}
                  height={200}
                  emptyText="No blood pressure readings"
                />
              </CardContent>
            </Card>
            <Card className="gap-4">
              <CardHeader>
                <CardTitle>Weight</CardTitle>
                <CardDescription>Kilograms</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart
                  labels={labels}
                  series={[{ key: "w", label: "Weight", color: "#0D7377", values: chrono.map((r) => r.weight_kg), decimals: 1, unit: "kg" }]}
                  height={200}
                  emptyText="No weight readings"
                />
              </CardContent>
            </Card>
            <Card className="gap-4">
              <CardHeader>
                <CardTitle>Sleep</CardTitle>
                <CardDescription>Hours per check-in (dashed line = 7 h goal)</CardDescription>
              </CardHeader>
              <CardContent>
                <MiniBars labels={labels} values={chrono.map((r) => r.sleep_hours)} unit="h" goal={7} height={180} />
              </CardContent>
            </Card>
          </div>

          <Card className="gap-0 py-0">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <p className="font-semibold">Check-ins</p>
              <p className="text-sm text-muted-foreground">{records.length} shown</p>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left text-xs text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2.5 font-medium">Date</th>
                    <th className="px-3 py-2.5 font-medium">Score</th>
                    <th className="px-3 py-2.5 font-medium">Weight</th>
                    <th className="px-3 py-2.5 font-medium">BMI</th>
                    <th className="px-3 py-2.5 font-medium">BP</th>
                    <th className="px-3 py-2.5 font-medium">HR</th>
                    <th className="px-3 py-2.5 font-medium">Temp</th>
                    <th className="px-3 py-2.5 font-medium">Sugar</th>
                    <th className="px-3 py-2.5 font-medium">Sleep</th>
                    <th className="px-3 py-2.5 font-medium">Water</th>
                    <th className="px-3 py-2.5 font-medium">Activity</th>
                    <th className="px-5 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r.id} className="border-t hover:bg-muted/50">
                      <td className="whitespace-nowrap px-5 py-3">{formatDateTime(r.recorded_at)}</td>
                      <td className={cn("px-3 py-3 font-semibold tabular-nums", wellnessTone(r.wellness_score))}>{fmt(r.wellness_score)}</td>
                      <td className="px-3 py-3 tabular-nums">{fmt(r.weight_kg, 1)}</td>
                      <td className="px-3 py-3 tabular-nums">{fmt(r.bmi, 1)}</td>
                      <td className="px-3 py-3 tabular-nums">{bp(r.systolic_bp, r.diastolic_bp)}</td>
                      <td className="px-3 py-3 tabular-nums">{fmt(r.heart_rate)}</td>
                      <td className="px-3 py-3 tabular-nums">{fmt(r.body_temperature_c, 1)}</td>
                      <td className="px-3 py-3 tabular-nums">{fmt(r.blood_sugar_mgdl)}</td>
                      <td className="px-3 py-3 tabular-nums">{fmt(r.sleep_hours, 1)}</td>
                      <td className="px-3 py-3 tabular-nums">{fmt(r.water_intake_liters, 1)}</td>
                      <td className="px-3 py-3 tabular-nums">{fmt(r.activity_minutes)}</td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => setEditing(r)} aria-label="Edit check-in">
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleting(r)} aria-label="Delete check-in" className="text-muted-foreground hover:text-destructive">
                          <Trash2 />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y md:hidden">
              {records.map((r) => (
                <li key={r.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{formatDateTime(r.recorded_at)}</p>
                      <p className={cn("text-xs font-semibold", wellnessTone(r.wellness_score))}>Score {fmt(r.wellness_score)}</p>
                    </div>
                    <div className="flex">
                      <Button variant="ghost" size="icon" onClick={() => setEditing(r)} aria-label="Edit check-in">
                        <Pencil />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleting(r)} aria-label="Delete check-in" className="text-muted-foreground">
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <dl className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5 text-xs">
                    {[
                      ["Weight", fmt(r.weight_kg, 1)],
                      ["BMI", fmt(r.bmi, 1)],
                      ["BP", bp(r.systolic_bp, r.diastolic_bp)],
                      ["HR", fmt(r.heart_rate)],
                      ["Sleep", fmt(r.sleep_hours, 1)],
                      ["Water", fmt(r.water_intake_liters, 1)],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="font-medium tabular-nums">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  {r.notes && <p className="mt-2 text-xs text-muted-foreground">{r.notes}</p>}
                </li>
              ))}
            </ul>

            {hasMore && (
              <div className="border-t p-3 text-center">
                <Button variant="outline" size="sm" onClick={() => void loadMore()} disabled={loadingMore}>
                  {loadingMore && <Loader2 className="animate-spin" />}
                  Load more
                </Button>
              </div>
            )}
          </Card>
        </>
      )}

      <Modal open={editing != null} onClose={() => setEditing(null)} title="Edit check-in" className="sm:max-w-2xl">
        {editing && <HealthRecordForm initial={editing} submitLabel="Save changes" onSubmit={saveEdit} onCancel={() => setEditing(null)} />}
      </Modal>

      <Modal open={deleting != null} onClose={() => setDeleting(null)} title="Delete this check-in?">
        <p className="text-sm text-muted-foreground">
          The check-in from <strong className="text-foreground">{deleting ? formatDateTime(deleting.recorded_at) : ""}</strong> will be permanently removed.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => void confirmDelete()} disabled={deleteBusy}>
            {deleteBusy && <Loader2 className="animate-spin" />}
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
