import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Activity, Droplets, HeartPulse, Loader2, Moon, Ruler } from "lucide-react";

import { InlineError } from "@/components/layout/PageStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { fmt, toDateTimeLocal } from "@/lib/health-format";
import type { BloodSugarContext, HealthRecord, HealthRecordInput } from "@/lib/health-types";
import { cn } from "@/lib/utils";

type Units = "metric" | "imperial";
const UNITS_KEY = "vc_units";

type FieldKey =
  | "age"
  | "height"
  | "weight"
  | "systolic_bp"
  | "diastolic_bp"
  | "heart_rate"
  | "temperature"
  | "blood_sugar_mgdl"
  | "sleep_hours"
  | "water_intake_liters"
  | "activity_minutes";

type Values = Record<FieldKey, string>;

function round(n: number, d = 1) {
  const f = Math.pow(10, d);
  return Math.round(n * f) / f;
}

function str(n: number | null | undefined): string {
  return n == null ? "" : String(n);
}

function initialValues(units: Units, r?: Partial<HealthRecord>): Values {
  const imperial = units === "imperial";
  return {
    age: str(r?.age),
    height: r?.height_cm == null ? "" : String(imperial ? round(r.height_cm / 2.54, 1) : r.height_cm),
    weight: r?.weight_kg == null ? "" : String(imperial ? round(r.weight_kg * 2.20462, 1) : r.weight_kg),
    systolic_bp: str(r?.systolic_bp),
    diastolic_bp: str(r?.diastolic_bp),
    heart_rate: str(r?.heart_rate),
    temperature:
      r?.body_temperature_c == null ? "" : String(imperial ? round(r.body_temperature_c * 1.8 + 32, 1) : r.body_temperature_c),
    blood_sugar_mgdl: str(r?.blood_sugar_mgdl),
    sleep_hours: str(r?.sleep_hours),
    water_intake_liters: str(r?.water_intake_liters),
    activity_minutes: str(r?.activity_minutes),
  };
}

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function Section({ icon, title, hint, children }: { icon: ReactNode; title: string; hint?: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-lg border bg-background p-4 sm:p-5">
      <legend className="sr-only">{title}</legend>
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground">{icon}</span>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function NumField({
  id,
  label,
  unit,
  value,
  onChange,
  min,
  max,
  step = "any",
  placeholder,
  help,
}: {
  id: string;
  label: string;
  unit?: string;
  value: string;
  onChange: (v: string) => void;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
  help?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={cn("h-10", unit && "pr-14")}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">{unit}</span>
        )}
      </div>
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}

export interface HealthRecordFormProps {
  initial?: Partial<HealthRecord>;
  submitLabel?: string;
  onSubmit: (input: HealthRecordInput) => Promise<string | null>;
  onCancel?: () => void;
  compact?: boolean;
}

export function HealthRecordForm({ initial, submitLabel = "Save check-in", onSubmit, onCancel }: HealthRecordFormProps) {
  const [units, setUnits] = useState<Units>(() => (localStorage.getItem(UNITS_KEY) === "imperial" ? "imperial" : "metric"));
  const [values, setValues] = useState<Values>(() => initialValues(units, initial));
  const [recordedAt, setRecordedAt] = useState(() => toDateTimeLocal(initial?.recorded_at));
  const [sugarContext, setSugarContext] = useState<BloodSugarContext>(initial?.blood_sugar_context ?? "random");
  const [activityType, setActivityType] = useState(initial?.activity_type ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const imperial = units === "imperial";
  const set = (k: FieldKey) => (v: string) => setValues((prev) => ({ ...prev, [k]: v }));

  function switchUnits(next: Units) {
    if (next === units) return;
    const h = num(values.height);
    const w = num(values.weight);
    const t = num(values.temperature);
    setValues((prev) => ({
      ...prev,
      height: h == null ? "" : String(next === "imperial" ? round(h / 2.54, 1) : round(h * 2.54, 1)),
      weight: w == null ? "" : String(next === "imperial" ? round(w * 2.20462, 1) : round(w / 2.20462, 1)),
      temperature: t == null ? "" : String(next === "imperial" ? round(t * 1.8 + 32, 1) : round((t - 32) / 1.8, 1)),
    }));
    setUnits(next);
    localStorage.setItem(UNITS_KEY, next);
  }

  const heightCm = useMemo(() => {
    const h = num(values.height);
    return h == null ? null : imperial ? h * 2.54 : h;
  }, [values.height, imperial]);
  const weightKg = useMemo(() => {
    const w = num(values.weight);
    return w == null ? null : imperial ? w / 2.20462 : w;
  }, [values.weight, imperial]);
  const bmiPreview = heightCm && weightKg ? weightKg / Math.pow(heightCm / 100, 2) : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const temp = num(values.temperature);
    const input: HealthRecordInput = {
      recorded_at: recordedAt ? new Date(recordedAt).toISOString() : undefined,
      age: num(values.age),
      height_cm: heightCm == null ? null : round(heightCm, 1),
      weight_kg: weightKg == null ? null : round(weightKg, 1),
      systolic_bp: num(values.systolic_bp),
      diastolic_bp: num(values.diastolic_bp),
      heart_rate: num(values.heart_rate),
      body_temperature_c: temp == null ? null : round(imperial ? (temp - 32) / 1.8 : temp, 1),
      blood_sugar_mgdl: num(values.blood_sugar_mgdl),
      blood_sugar_context: num(values.blood_sugar_mgdl) == null ? undefined : sugarContext,
      sleep_hours: num(values.sleep_hours),
      water_intake_liters: num(values.water_intake_liters),
      activity_minutes: num(values.activity_minutes),
      activity_type: activityType.trim() || null,
      notes: notes.trim() || null,
    };
    const metricKeys: (keyof HealthRecordInput)[] = [
      "weight_kg",
      "systolic_bp",
      "diastolic_bp",
      "heart_rate",
      "body_temperature_c",
      "blood_sugar_mgdl",
      "sleep_hours",
      "water_intake_liters",
      "activity_minutes",
    ];
    if (!initial?.id && metricKeys.every((k) => input[k] == null)) {
      setError("Enter at least one measurement — for example weight, blood pressure or sleep.");
      return;
    }
    const sys = input.systolic_bp;
    const dia = input.diastolic_bp;
    if ((sys == null) !== (dia == null)) {
      setError("Enter both the top (systolic) and bottom (diastolic) blood pressure numbers.");
      return;
    }
    if (sys != null && dia != null && dia >= sys) {
      setError("Diastolic (bottom number) should be lower than systolic (top number).");
      return;
    }
    setBusy(true);
    const err = await onSubmit(input);
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid gap-1.5">
          <Label htmlFor="recorded_at">Date &amp; time</Label>
          <Input
            id="recorded_at"
            type="datetime-local"
            value={recordedAt}
            max={toDateTimeLocal(new Date().toISOString())}
            onChange={(e) => setRecordedAt(e.target.value)}
            className="h-10 sm:w-60"
          />
        </div>
        <div className="inline-flex self-start rounded-md border bg-muted p-0.5 text-sm sm:self-auto" role="radiogroup" aria-label="Units">
          {(["metric", "imperial"] as Units[]).map((u) => (
            <button
              key={u}
              type="button"
              role="radio"
              aria-checked={units === u}
              onClick={() => switchUnits(u)}
              className={cn(
                "rounded px-3 py-1 font-medium",
                units === u ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {u === "metric" ? "Metric (kg, cm, °C)" : "Imperial (lb, in, °F)"}
            </button>
          ))}
        </div>
      </div>

      <InlineError message={error} />

      <Section icon={<Ruler className="h-4 w-4" />} title="Body" hint="Height and age default to your profile if left blank.">
        <NumField id="age" label="Age" unit="years" min={1} max={120} step="1" value={values.age} onChange={set("age")} />
        <NumField id="height" label="Height" unit={imperial ? "in" : "cm"} min={imperial ? 20 : 50} max={imperial ? 100 : 250} value={values.height} onChange={set("height")} />
        <NumField id="weight" label="Weight" unit={imperial ? "lb" : "kg"} min={imperial ? 4 : 2} max={imperial ? 1100 : 500} value={values.weight} onChange={set("weight")} />
        <div className="grid gap-1.5">
          <span className="text-sm font-medium">BMI (calculated)</span>
          <div className="flex h-10 items-center rounded-md border bg-muted px-3 text-sm">
            {bmiPreview ? (
              <span className="font-semibold tabular-nums">{fmt(bmiPreview, 1)}</span>
            ) : (
              <span className="text-muted-foreground">Enter height and weight</span>
            )}
          </div>
        </div>
      </Section>

      <Section icon={<HeartPulse className="h-4 w-4" />} title="Vitals" hint="Measure while resting and seated.">
        <div className="grid gap-1.5 sm:col-span-2">
          <Label htmlFor="systolic_bp">Blood pressure</Label>
          <div className="flex items-center gap-2">
            <Input id="systolic_bp" type="number" inputMode="numeric" min={50} max={260} placeholder="120" value={values.systolic_bp} onChange={(e) => set("systolic_bp")(e.target.value)} className="h-10" aria-label="Systolic" />
            <span className="text-lg text-muted-foreground">/</span>
            <Input id="diastolic_bp" type="number" inputMode="numeric" min={30} max={180} placeholder="80" value={values.diastolic_bp} onChange={(e) => set("diastolic_bp")(e.target.value)} className="h-10" aria-label="Diastolic" />
            <span className="shrink-0 text-xs text-muted-foreground">mmHg</span>
          </div>
        </div>
        <NumField id="heart_rate" label="Heart rate" unit="bpm" min={25} max={250} step="1" placeholder="72" value={values.heart_rate} onChange={set("heart_rate")} />
        <NumField
          id="temperature"
          label="Body temperature"
          unit={imperial ? "°F" : "°C"}
          min={imperial ? 86 : 30}
          max={imperial ? 113 : 45}
          placeholder={imperial ? "98.6" : "36.8"}
          value={values.temperature}
          onChange={set("temperature")}
        />
      </Section>

      <Section icon={<Droplets className="h-4 w-4" />} title="Blood sugar">
        <NumField id="blood_sugar" label="Blood glucose" unit="mg/dL" min={20} max={600} placeholder="95" value={values.blood_sugar_mgdl} onChange={set("blood_sugar_mgdl")} />
        <div className="grid gap-1.5">
          <Label htmlFor="sugar_context">When measured</Label>
          <NativeSelect id="sugar_context" value={sugarContext} onChange={(e) => setSugarContext(e.target.value as BloodSugarContext)} className="h-10">
            <option value="fasting">Fasting (8+ hours)</option>
            <option value="before_meal">Before a meal</option>
            <option value="after_meal">1–2 hours after a meal</option>
            <option value="random">Random / not sure</option>
          </NativeSelect>
        </div>
      </Section>

      <Section icon={<Moon className="h-4 w-4" />} title="Daily habits" hint="Totals for the last 24 hours.">
        <NumField id="sleep" label="Sleep" unit="hours" min={0} max={24} placeholder="7.5" value={values.sleep_hours} onChange={set("sleep_hours")} />
        <NumField id="water" label="Water intake" unit="liters" min={0} max={15} placeholder="2" value={values.water_intake_liters} onChange={set("water_intake_liters")} help="1 glass ≈ 0.25 L" />
        <NumField id="activity" label="Physical activity" unit="min" min={0} max={1440} step="1" placeholder="30" value={values.activity_minutes} onChange={set("activity_minutes")} />
        <div className="grid gap-1.5">
          <Label htmlFor="activity_type">Activity type</Label>
          <Input id="activity_type" list="activity-types" value={activityType} onChange={(e) => setActivityType(e.target.value)} placeholder="Walking" className="h-10" maxLength={80} />
          <datalist id="activity-types">
            {["Walking", "Running", "Cycling", "Swimming", "Yoga", "Strength training", "Sports", "Household chores"].map((a) => (
              <option key={a} value={a} />
            ))}
          </datalist>
        </div>
      </Section>

      <div className="rounded-lg border bg-background p-4 sm:p-5">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-accent-foreground">
            <Activity className="h-4 w-4" />
          </span>
          <Label htmlFor="notes" className="text-sm font-semibold">
            Notes
          </Label>
        </div>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How are you feeling today? Anything unusual?" maxLength={1000} />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="h-10">
            Cancel
          </Button>
        )}
        <Button type="submit" className="h-10" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
