import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, PartyPopper } from "lucide-react";

import { useSession } from "@/components/AuthSessionProvider";
import { ErrorState, InlineError, LoadingState, PageHeader } from "@/components/layout/PageStates";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { formatDate, localDate } from "@/lib/health-format";
import type { BloodType, Gender, ProfileResponse } from "@/lib/health-types";

const BLOOD_TYPES: BloodType[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"];

interface Form {
  name: string;
  date_of_birth: string;
  gender: Gender | "";
  height_cm: string;
  blood_type: BloodType | "";
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_conditions: string;
  allergies: string;
  current_medications: string;
}

function toForm(p: ProfileResponse): Form {
  return {
    name: p.user.name ?? "",
    date_of_birth: p.profile.date_of_birth?.slice(0, 10) ?? "",
    gender: p.profile.gender ?? "",
    height_cm: p.profile.height_cm == null ? "" : String(p.profile.height_cm),
    blood_type: (p.profile.blood_type as BloodType | null) ?? "",
    phone: p.profile.phone ?? "",
    emergency_contact_name: p.profile.emergency_contact_name ?? "",
    emergency_contact_phone: p.profile.emergency_contact_phone ?? "",
    medical_conditions: p.profile.medical_conditions ?? "",
    allergies: p.profile.allergies ?? "",
    current_medications: p.profile.current_medications ?? "",
  };
}

const orNull = (s: string) => (s.trim() ? s.trim() : null);

export default function ProfilePage() {
  const { update } = useSession();
  const [params] = useSearchParams();
  const welcome = params.get("welcome") === "1";
  const [data, setData] = useState<ProfileResponse | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const res = await api.get<ProfileResponse>("/api/profile");
    if (!res.success) setLoadError(res.error);
    else {
      setData(res.data);
      setForm(toForm(res.data));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setSaved(false);
    setForm((f) => (f ? { ...f, [k]: v } : f));
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!form) return;
    setError(null);
    if (!form.name.trim()) return setError("Please enter your name.");
    const height = form.height_cm.trim() ? Number(form.height_cm) : null;
    if (height != null && (!Number.isFinite(height) || height < 50 || height > 250)) {
      return setError("Height should be between 50 and 250 cm.");
    }
    setBusy(true);
    const res = await api.put<ProfileResponse>("/api/profile", {
      name: form.name.trim(),
      date_of_birth: orNull(form.date_of_birth),
      ...(form.gender ? { gender: form.gender } : {}),
      height_cm: height,
      ...(form.blood_type ? { blood_type: form.blood_type } : {}),
      phone: orNull(form.phone),
      emergency_contact_name: orNull(form.emergency_contact_name),
      emergency_contact_phone: orNull(form.emergency_contact_phone),
      medical_conditions: orNull(form.medical_conditions),
      allergies: orNull(form.allergies),
      current_medications: orNull(form.current_medications),
    });
    setBusy(false);
    if (!res.success) return setError(res.error);
    setData(res.data);
    setForm(toForm(res.data));
    setSaved(true);
    void update();
  }

  if (loading) return <LoadingState />;
  if (loadError || !data || !form) return <ErrorState message={loadError ?? "Could not load profile."} onRetry={load} />;

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeader title="Profile" description="Your personal and medical details. Used to personalise your scores and included in your health report." />

      {welcome && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-accent p-4 text-sm text-accent-foreground">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Welcome to Vital Compass!</p>
            <p>
              Add a few details below (date of birth and height help with BMI and scoring), then{" "}
              <Link to="/check-in" className="font-medium underline">
                log your first check-in
              </Link>
              .
            </p>
          </div>
        </div>
      )}

      <form onSubmit={submit} className="grid gap-6">
        <Card className="gap-5">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Member since {formatDate(data.user.created_at)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={form.name} maxLength={120} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={data.user.email ?? ""} disabled />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={form.phone} maxLength={40} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div className="flex items-end text-xs text-muted-foreground">
              <p>
                Need to change your password?{" "}
                <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                  Send a reset link
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-5">
          <CardHeader>
            <CardTitle>Health details</CardTitle>
            <CardDescription>
              {data.profile.age != null ? `Age ${data.profile.age}` : "Add your date of birth to calculate age automatically."}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" type="date" max={localDate()} value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="gender">Gender</Label>
              <NativeSelect id="gender" value={form.gender} onChange={(e) => set("gender", e.target.value as Gender | "")}>
                <option value="">Select…</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </NativeSelect>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="height">Height (cm)</Label>
              <Input id="height" type="number" inputMode="decimal" min={50} max={250} step="any" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="blood">Blood type</Label>
              <NativeSelect id="blood" value={form.blood_type} onChange={(e) => set("blood_type", e.target.value as BloodType | "")}>
                <option value="">Select…</option>
                {BLOOD_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {b === "unknown" ? "I don't know" : b}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="conditions">Medical conditions</Label>
              <Textarea id="conditions" value={form.medical_conditions} maxLength={1000} onChange={(e) => set("medical_conditions", e.target.value)} placeholder="e.g. Type 2 diabetes, asthma" />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Textarea id="allergies" value={form.allergies} maxLength={1000} onChange={(e) => set("allergies", e.target.value)} placeholder="e.g. Penicillin, peanuts" />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="meds">Current medications</Label>
              <Textarea id="meds" value={form.current_medications} maxLength={1000} onChange={(e) => set("current_medications", e.target.value)} placeholder="e.g. Metformin 500 mg twice daily" />
            </div>
          </CardContent>
        </Card>

        <Card className="gap-5">
          <CardHeader>
            <CardTitle>Emergency contact</CardTitle>
            <CardDescription>Included in your downloadable health report.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="ec-name">Name</Label>
              <Input id="ec-name" value={form.emergency_contact_name} maxLength={120} onChange={(e) => set("emergency_contact_name", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ec-phone">Phone</Label>
              <Input id="ec-phone" type="tel" value={form.emergency_contact_phone} maxLength={40} onChange={(e) => set("emergency_contact_phone", e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <InlineError message={error} />
        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Saved
            </span>
          )}
          <Button type="submit" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            Save profile
          </Button>
        </div>
      </form>
    </div>
  );
}
