import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertOctagon,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Loader2,
  Phone,
  Search,
  Stethoscope,
  Trash2,
  X,
} from "lucide-react";

import { useNotifications } from "@/components/layout/NotificationsProvider";
import { EmptyState, ErrorState, InlineError, LoadingState, PageHeader } from "@/components/layout/PageStates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { DURATIONS, SEVERITIES, URGENCY, durationLabel, relativeTime } from "@/lib/health-format";
import type { CatalogSymptom, Duration, Severity, SymptomCheck } from "@/lib/health-types";
import { cn } from "@/lib/utils";

const STEPS = ["Symptoms", "Details", "Guidance"];

function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-sm">
      {STEPS.map((label, i) => (
        <li key={label} className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
              i < step && "border-primary bg-primary text-primary-foreground",
              i === step && "border-primary text-primary",
              i > step && "text-muted-foreground"
            )}
          >
            {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span className={cn("hidden font-medium sm:inline", i === step ? "text-foreground" : "text-muted-foreground")}>{label}</span>
          {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 text-gray-300" />}
        </li>
      ))}
    </ol>
  );
}

function GuidanceView({ check }: { check: SymptomCheck }) {
  const g = check.guidance;
  const u = URGENCY[g.urgency_level];
  const isEmergency = g.urgency_level === "emergency";
  return (
    <div className="grid gap-5">
      {isEmergency && (
        <div className="flex items-start gap-3 rounded-lg bg-red-600 p-4 text-white" role="alert">
          <Phone className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Seek emergency care now</p>
            <p className="text-sm text-white/90">
              Call your local emergency number (for example 911, 112 or 999) or go to the nearest emergency department. Do not wait for symptoms to
              get worse.
            </p>
          </div>
        </div>
      )}

      <div className={cn("rounded-lg border p-5", u.panel)}>
        <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold", u.badge)}>{u.label}</span>
        <h3 className={cn("mt-3 text-lg font-semibold", u.accent)}>{g.headline}</h3>
        <p className="mt-1 text-sm text-gray-700">{g.summary}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {check.symptoms.map((s) => (
            <span key={s.id} className="rounded-full border bg-background px-2.5 py-0.5 text-xs">
              {s.label}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {durationLabel(check.duration)} · {titleCase(check.severity)}
        </p>
      </div>

      {g.red_flags_detected.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-red-800">
            <AlertOctagon className="h-4 w-4" />
            Warning signs detected
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-800">
            {g.red_flags_detected.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {g.recommendations.length > 0 && (
          <section className="rounded-lg border bg-background p-4">
            <h4 className="text-sm font-semibold">What to do next</h4>
            <ul className="mt-2 grid gap-1.5 text-sm">
              {g.recommendations.map((r) => (
                <li key={r} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}
        {g.see_doctor_if.length > 0 && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h4 className="text-sm font-semibold text-amber-900">See a doctor if</h4>
            <ul className="mt-2 grid gap-1.5 text-sm text-amber-900">
              {g.see_doctor_if.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}
        {g.self_care_tips.length > 0 && (
          <section className="rounded-lg border bg-background p-4 md:col-span-2">
            <h4 className="text-sm font-semibold">Self-care tips</h4>
            <ul className="mt-2 grid gap-1.5 text-sm sm:grid-cols-2">
              {g.self_care_tips.map((r) => (
                <li key={r} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {g.related_areas.length > 0 && (
        <p className="text-xs text-muted-foreground">Related areas: {g.related_areas.map(titleCase).join(", ")}</p>
      )}
      <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">{g.disclaimer}</p>
    </div>
  );
}

export default function SymptomsPage() {
  const { refresh } = useNotifications();
  const [catalog, setCatalog] = useState<CatalogSymptom[]>([]);
  const [history, setHistory] = useState<SymptomCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [duration, setDuration] = useState<Duration | null>(null);
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SymptomCheck | null>(null);
  const [viewing, setViewing] = useState<SymptomCheck | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const [cat, hist] = await Promise.all([
      api.get<CatalogSymptom[]>("/api/symptom-checks/catalog"),
      api.get<SymptomCheck[]>("/api/symptom-checks"),
    ]);
    if (!cat.success) setLoadError(cat.error);
    else setCatalog(cat.data);
    if (hist.success) setHistory(hist.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, CatalogSymptom[]>();
    for (const s of catalog) {
      if (q && !s.label.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q)) continue;
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return [...map.entries()];
  }, [catalog, search]);

  const byId = useMemo(() => new Map(catalog.map((s) => [s.id, s])), [catalog]);
  const redFlagSelected = selected.some((id) => byId.get(id)?.red_flag);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function reset() {
    setStep(0);
    setSelected([]);
    setSearch("");
    setDuration(null);
    setSeverity(null);
    setNotes("");
    setResult(null);
    setError(null);
  }

  async function submit() {
    if (!duration || !severity) {
      setError("Please choose how long you've had these symptoms and how severe they are.");
      return;
    }
    setError(null);
    setSubmitting(true);
    const res = await api.post<SymptomCheck>("/api/symptom-checks", {
      symptoms: selected,
      duration,
      severity,
      notes: notes.trim() || null,
    });
    setSubmitting(false);
    if (!res.success) {
      setError(res.error);
      return;
    }
    setResult(res.data);
    setHistory((prev) => [res.data, ...prev]);
    setStep(2);
    void refresh();
    window.scrollTo({ top: 0 });
  }

  async function remove(id: string) {
    const res = await api.del(`/api/symptom-checks/${id}`);
    if (res.success) {
      setHistory((prev) => prev.filter((h) => h.id !== id));
      if (viewing?.id === id) setViewing(null);
    }
  }

  if (loading) return <LoadingState />;
  if (loadError) return <ErrorState message={loadError} onRetry={load} />;

  return (
    <div className="grid gap-6">
      <PageHeader title="Symptom checker" description="Answer a few questions to get general guidance and know when to see a doctor." />

      <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <AlertOctagon className="mt-0.5 h-5 w-5 shrink-0" />
        <p>
          <strong>If you have chest pain, difficulty breathing, signs of stroke, severe bleeding or loss of consciousness, call emergency services
          immediately.</strong>{" "}
          This tool does not diagnose conditions.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="gap-0">
          <CardContent>
            <Stepper step={step} />

            {step === 0 && (
              <div className="grid gap-4">
                <div>
                  <h2 className="text-lg font-semibold">What symptoms do you have?</h2>
                  <p className="text-sm text-muted-foreground">Select all that apply.</p>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search symptoms, e.g. headache" className="h-10 pl-9" />
                </div>

                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 rounded-md bg-accent/60 p-3">
                    {selected.map((id) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggle(id)}
                        className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground"
                      >
                        {byId.get(id)?.label ?? id}
                        <X className="h-3 w-3" />
                      </button>
                    ))}
                  </div>
                )}

                {redFlagSelected && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                    You've selected a symptom that can be serious. If it is sudden or severe, seek emergency care now.
                  </div>
                )}

                <div className="grid max-h-[28rem] gap-5 overflow-y-auto pr-1">
                  {grouped.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No symptoms match “{search}”.</p>}
                  {grouped.map(([category, items]) => (
                    <div key={category}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{titleCase(category)}</p>
                      <div className="flex flex-wrap gap-2">
                        {items.map((s) => {
                          const on = selected.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => toggle(s.id)}
                              aria-pressed={on}
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
                                on ? "border-primary bg-accent font-medium text-accent-foreground" : "bg-background hover:border-gray-300 hover:bg-muted"
                              )}
                            >
                              {on && <Check className="h-3.5 w-3.5" />}
                              {s.label}
                              {s.red_flag && <span className="h-1.5 w-1.5 rounded-full bg-red-500" title="Potentially serious" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Potentially serious symptom
                </p>
                <div className="flex justify-end border-t pt-4">
                  <Button onClick={() => setStep(1)} disabled={selected.length === 0}>
                    Continue
                    <ArrowRight />
                  </Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="grid gap-6">
                <div>
                  <h2 className="text-lg font-semibold">How long have you had them?</h2>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {DURATIONS.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => setDuration(d.value)}
                        aria-pressed={duration === d.value}
                        className={cn(
                          "rounded-md border px-3 py-2.5 text-left text-sm",
                          duration === d.value ? "border-primary bg-accent font-medium text-accent-foreground" : "hover:bg-muted"
                        )}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-semibold">How severe are they?</h2>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    {SEVERITIES.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setSeverity(s.value)}
                        aria-pressed={severity === s.value}
                        className={cn(
                          "rounded-md border px-3 py-2.5 text-left",
                          severity === s.value ? "border-primary bg-accent text-accent-foreground" : "hover:bg-muted"
                        )}
                      >
                        <span className="block text-sm font-medium">{s.label}</span>
                        <span className="block text-xs text-muted-foreground">{s.hint}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="notes">Anything else? (optional)</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} placeholder="e.g. started after a long run, worse in the morning" />
                </div>
                <InlineError message={error} />
                <div className="flex justify-between border-t pt-4">
                  <Button variant="outline" onClick={() => setStep(0)}>
                    <ArrowLeft />
                    Back
                  </Button>
                  <Button onClick={() => void submit()} disabled={submitting || !duration || !severity}>
                    {submitting && <Loader2 className="animate-spin" />}
                    Get guidance
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && result && (
              <div className="grid gap-5">
                <GuidanceView check={result} />
                <div className="flex justify-end border-t pt-4">
                  <Button onClick={reset}>Start a new check</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="h-fit gap-4">
          <CardHeader>
            <CardTitle>Past checks</CardTitle>
            <CardDescription>Your previous symptom checks</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <EmptyState icon={<Stethoscope className="h-6 w-6" />} title="No checks yet" description="Your results will be saved here." />
            ) : (
              <ul className="grid gap-2">
                {history.slice(0, 15).map((h) => {
                  const u = URGENCY[h.urgency_level];
                  return (
                    <li key={h.id} className="flex items-start gap-2 rounded-md border p-3">
                      <button type="button" onClick={() => setViewing(h)} className="min-w-0 flex-1 text-left">
                        <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold", u.badge)}>{u.label}</span>
                        <span className="mt-1.5 block truncate text-sm font-medium">{h.symptoms.map((s) => s.label).join(", ")}</span>
                        <span className="block text-xs text-muted-foreground">{relativeTime(h.created_at)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(h.id)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                        aria-label="Delete check"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal open={viewing != null} onClose={() => setViewing(null)} title="Symptom check result" className="sm:max-w-2xl">
        {viewing && <GuidanceView check={viewing} />}
      </Modal>
    </div>
  );
}
