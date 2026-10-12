import type { ReactNode } from "react";
import { Activity, BellRing, FileDown, HeartPulse, ShieldCheck, Stethoscope } from "lucide-react";

import { DISCLAIMER_SHORT } from "@/lib/health-format";

const FEATURES = [
  { icon: Activity, title: "Track your vitals", text: "Blood pressure, heart rate, sleep, water and more in one place." },
  { icon: Stethoscope, title: "Guided symptom checker", text: "Clear next steps, including when to see a doctor." },
  { icon: BellRing, title: "Daily reminders", text: "Check-ins, medication, exercise and water." },
  { icon: FileDown, title: "Downloadable report", text: "Share a PDF summary with your care provider." },
];

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border-[40px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full border-[48px] border-white/5" />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <HeartPulse className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">Vital Compass</span>
        </div>

        <div className="relative max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            Private &amp; secure health records
          </span>
          <h2 className="mt-5 text-3xl font-semibold leading-tight">Your daily health check-up, simplified.</h2>
          <p className="mt-3 text-white/75">
            Log a few numbers each day and get a clear picture of how you're doing — with gentle guidance along the way.
          </p>
          <ul className="mt-8 grid gap-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{title}</span>
                  <span className="block text-sm text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
          {[
            ["10", "health metrics"],
            ["50+", "symptoms covered"],
            ["1-tap", "PDF report"],
          ].map(([value, label]) => (
            <div key={label}>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs text-white/70">{label}</p>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex flex-col bg-background">
        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <HeartPulse className="h-4 w-4" />
              </span>
              <span className="font-semibold tracking-tight">Vital Compass</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-7">{children}</div>
            {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
          </div>
        </div>
        <p className="border-t bg-muted px-5 py-3 text-center text-xs text-muted-foreground">{DISCLAIMER_SHORT}</p>
      </main>
    </div>
  );
}
