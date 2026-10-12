// __AS_PLACEHOLDER_HOME__ — platform stub; implementation agent must overwrite.
const examples = [
  { icon: "🤝", label: "A CRM to track leads, deals & follow-ups" },
  { icon: "🧾", label: "An invoicing app with payment tracking" },
  { icon: "📦", label: "An inventory tracker with low-stock alerts" },
  { icon: "🔑", label: "A client portal with project updates" },
];

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.035)_1px,transparent_1px)] [background-size:72px_72px] dark:[background-image:linear-gradient(rgba(255,255,255,0.022)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.022)_1px,transparent_1px)]"
      />
      <div className="relative flex max-w-2xl flex-col items-center px-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Your canvas is ready
        </span>
        <h1 className="mt-7 text-[clamp(40px,5.5vw,58px)] font-bold leading-[1.05] tracking-[-0.03em]">
          What should we <span className="text-primary">build</span>?
        </h1>
        <p className="mt-4 max-w-md text-[17px] leading-relaxed text-muted-foreground">
          Describe your app in the chat panel on the left and hit{" "}
          <kbd className="rounded-md border border-b-2 bg-card px-[7px] py-px text-[13px] font-semibold text-foreground">
            Enter
          </kbd>{" "}
          — I'll design it, write the code, and preview it live right here.
        </p>
        <div className="mt-10 w-full">
          <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Need a starting point?
          </p>
          <div className="grid grid-cols-2 gap-2.5 max-sm:grid-cols-1">
            {examples.map((ex) => (
              <div
                key={ex.label}
                className="flex select-none items-center gap-3 rounded-2xl border bg-card px-4 py-3.5 text-left text-[13.5px] font-medium"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[15px]">
                  {ex.icon}
                </span>
                {ex.label}
              </div>
            ))}
          </div>
        </div>
        <p className="mt-11 text-xs text-muted-foreground/70">
          You can change anything later — just ask in the chat.
        </p>
      </div>
    </main>
  );
}
