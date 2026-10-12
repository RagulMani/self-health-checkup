import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

import { ScoreRing } from "@/components/health/Charts";
import { HealthRecordForm } from "@/components/health/HealthRecordForm";
import { AlertList, ScoreBreakdown } from "@/components/health/ScoreBreakdown";
import { useNotifications } from "@/components/layout/NotificationsProvider";
import { LoadingState, PageHeader } from "@/components/layout/PageStates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api-client";
import { fmt } from "@/lib/health-format";
import type { HealthRecord, HealthRecordInput, ProfileResponse, RecordResult } from "@/lib/health-types";

function wellnessLabel(score: number | null): string {
  if (score == null) return "No score";
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Needs attention";
}

export default function CheckInPage() {
  const { refresh } = useNotifications();
  const [defaults, setDefaults] = useState<Partial<HealthRecord> | null>(null);
  const [result, setResult] = useState<RecordResult | null>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    void api.get<ProfileResponse>("/api/profile").then((res) => {
      setDefaults(res.success ? { age: res.data.profile.age, height_cm: res.data.profile.height_cm } : {});
    });
  }, []);

  async function submit(input: HealthRecordInput): Promise<string | null> {
    const res = await api.post<RecordResult>("/api/health-records", input);
    if (!res.success) return res.error;
    setResult(res.data);
    void refresh();
    window.scrollTo({ top: 0 });
    return null;
  }

  if (result) {
    const r = result.record;
    return (
      <div className="mx-auto grid max-w-3xl gap-6">
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />
          Check-in saved. Here's how this reading looks.
        </div>
        <Card className="gap-0 py-6">
          <CardContent className="flex flex-col items-center gap-6 sm:flex-row">
            <ScoreRing score={r.wellness_score} label={wellnessLabel(r.wellness_score)} size={148} />
            <div className="grid flex-1 grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">BMI</p>
                <p className="text-lg font-semibold">{fmt(r.bmi, 1)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Blood pressure</p>
                <p className="text-lg font-semibold">{r.systolic_bp != null ? `${r.systolic_bp}/${r.diastolic_bp}` : "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Heart rate</p>
                <p className="text-lg font-semibold">{fmt(r.heart_rate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Sleep</p>
                <p className="text-lg font-semibold">{fmt(r.sleep_hours, 1)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Water</p>
                <p className="text-lg font-semibold">{fmt(r.water_intake_liters, 1)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Activity</p>
                <p className="text-lg font-semibold">{fmt(r.activity_minutes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <AlertList alerts={result.alerts} />
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>Score breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown components={result.components} />
          </CardContent>
        </Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setResult(null);
              setFormKey((k) => k + 1);
            }}
          >
            Log another
          </Button>
          <Button asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Log a health check-in" description="Fill in what you have — every field is optional, but at least one measurement is needed." />
      {defaults === null ? <LoadingState /> : <HealthRecordForm key={formKey} initial={defaults} onSubmit={submit} />}
    </div>
  );
}
