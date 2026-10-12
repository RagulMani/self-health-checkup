import type { HealthReport } from "@/lib/health-types";

const TEAL: [number, number, number] = [13, 115, 119];
const GRAY: [number, number, number] = [107, 114, 128];
const DARK: [number, number, number] = [17, 24, 39];

function n(v: number | null | undefined, d = 0): string {
  if (v == null || Number.isNaN(v)) return "-";
  return v.toLocaleString("en-US", { maximumFractionDigits: d });
}

function bp(s: number | null | undefined, d: number | null | undefined): string {
  if (s == null && d == null) return "-";
  return `${s != null ? Math.round(s) : "-"}/${d != null ? Math.round(d) : "-"}`;
}

function date(iso: string, withTime = false): string {
  const dt = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T00:00:00`) : new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit" } : {}),
  });
}

function label(s: string | null | undefined): string {
  if (!s) return "-";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function ascii(s: string): string {
  return s.replace(/[—–]/g, "-").replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/…/g, "...").replace(/≥/g, ">=").replace(/≤/g, "<=");
}

export async function downloadHealthReport(report: HealthReport): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 40;
  let y = 0;

  const lastY = () => (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  const ensure = (space: number) => {
    if (y + space > H - 60) {
      doc.addPage();
      y = M;
    }
  };
  const heading = (text: string) => {
    ensure(40);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...TEAL);
    doc.text(text, M, y);
    doc.setDrawColor(229, 231, 235);
    doc.line(M, y + 6, W - M, y + 6);
    y += 18;
  };
  const paragraph = (text: string, size = 9.5, color: [number, number, number] = DARK) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(ascii(text), W - M * 2) as string[];
    ensure(lines.length * (size + 3));
    doc.text(lines, M, y);
    y += lines.length * (size + 3) + 4;
  };
  const bullets = (items: string[]) => {
    for (const item of items) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...DARK);
      const lines = doc.splitTextToSize(ascii(item), W - M * 2 - 14) as string[];
      ensure(lines.length * 13);
      doc.setFillColor(...TEAL);
      doc.circle(M + 3, y - 3, 1.6, "F");
      doc.text(lines, M + 12, y);
      y += lines.length * 12.5 + 3;
    }
    y += 4;
  };
  const tableDefaults = {
    margin: { left: M, right: M },
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 4, textColor: DARK, lineColor: [229, 231, 235] as [number, number, number], lineWidth: 0.5 },
    headStyles: { fillColor: [248, 249, 250] as [number, number, number], textColor: GRAY, fontStyle: "bold" as const },
    alternateRowStyles: { fillColor: [255, 255, 255] as [number, number, number] },
  };

  doc.setFillColor(...TEAL);
  doc.rect(0, 0, W, 84, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Personal Health Report", M, 38);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(ascii(`${report.user.name ?? ""}${report.user.email ? `  |  ${report.user.email}` : ""}`), M, 56);
  doc.text(`Period: ${date(report.period.from)} - ${date(report.period.to)} (${report.period.days} days)`, M, 70);
  doc.setFontSize(8.5);
  doc.text(`Generated ${date(report.generated_at, true)}`, W - M, 38, { align: "right" });
  doc.text("Vital Compass", W - M, 52, { align: "right" });
  y = 108;

  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(253, 230, 138);
  const discLines = doc.splitTextToSize(ascii(report.disclaimer), W - M * 2 - 20) as string[];
  const discH = discLines.length * 11 + 18;
  doc.roundedRect(M, y - 12, W - M * 2, discH, 4, 4, "FD");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text("Important", M + 10, y + 1);
  doc.setFont("helvetica", "normal");
  doc.text(discLines, M + 10, y + 13);
  y += discH + 8;

  heading("Summary");
  const s = report.snapshot;
  const boxes: [string, string, string][] = [
    ["Wellness score", s.wellness_score != null ? `${Math.round(s.wellness_score)}/100` : "-", s.wellness_label ?? "No recent data"],
    ["BMI", n(s.bmi, 1), s.bmi_category ?? "-"],
    ["Period avg score", n(report.averages.wellness_score), `${report.averages.record_count} check-ins`],
  ];
  const bw = (W - M * 2 - 20) / 3;
  boxes.forEach(([t, v, sub], i) => {
    const x = M + i * (bw + 10);
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, bw, 58, 4, 4, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(t, x + 10, y + 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...DARK);
    doc.text(v, x + 10, y + 36);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(ascii(sub), x + 10, y + 49);
  });
  y += 76;

  heading("Profile");
  const p = report.profile;
  autoTable(doc, {
    ...tableDefaults,
    startY: y,
    theme: "grid",
    body: [
      ["Age", n(p.age), "Gender", label(p.gender)],
      ["Height", p.height_cm != null ? `${n(p.height_cm, 1)} cm` : "-", "Blood type", p.blood_type ?? "-"],
      ["Medical conditions", { content: ascii(p.medical_conditions || "None recorded"), colSpan: 3 }],
      ["Allergies", { content: ascii(p.allergies || "None recorded"), colSpan: 3 }],
      ["Current medications", { content: ascii(p.current_medications || "None recorded"), colSpan: 3 }],
      [
        "Emergency contact",
        { content: ascii([p.emergency_contact_name, p.emergency_contact_phone].filter(Boolean).join(" - ") || "-"), colSpan: 3 },
      ],
    ],
    columnStyles: { 0: { fontStyle: "bold", textColor: GRAY, cellWidth: 110 }, 2: { fontStyle: "bold", textColor: GRAY, cellWidth: 80 } },
  });
  y = lastY() + 22;

  heading("Health metrics");
  const m = s.metrics;
  const a = report.averages;
  autoTable(doc, {
    ...tableDefaults,
    startY: y,
    theme: "grid",
    head: [["Metric", "Latest", "Period average", "Typical healthy range"]],
    body: [
      ["Weight", m.weight_kg != null ? `${n(m.weight_kg, 1)} kg` : "-", a.weight_kg != null ? `${n(a.weight_kg, 1)} kg` : "-", "BMI 18.5-24.9"],
      ["Blood pressure", `${bp(m.systolic_bp, m.diastolic_bp)} mmHg`, `${bp(a.systolic_bp, a.diastolic_bp)} mmHg`, "Below 120/80 mmHg"],
      ["Heart rate", `${n(m.heart_rate)} bpm`, `${n(a.heart_rate)} bpm`, "60-100 bpm at rest"],
      ["Body temperature", `${n(m.body_temperature_c, 1)} \u00b0C`, `${n(a.body_temperature_c, 1)} \u00b0C`, "36.1-37.2 \u00b0C"],
      [
        "Blood sugar",
        `${n(m.blood_sugar_mgdl)} mg/dL${m.blood_sugar_context ? ` (${label(m.blood_sugar_context).toLowerCase()})` : ""}`,
        `${n(a.blood_sugar_mgdl)} mg/dL`,
        "Fasting 70-99 mg/dL",
      ],
      ["Sleep", `${n(m.sleep_hours, 1)} h`, `${n(a.sleep_hours, 1)} h`, "7-9 hours"],
      ["Water intake", `${n(m.water_intake_liters, 1)} L`, `${n(a.water_intake_liters, 1)} L`, "About 2-3 L"],
      ["Physical activity", `${n(m.activity_minutes)} min`, `${n(a.activity_minutes)} min`, "30+ min per day"],
    ],
    columnStyles: { 0: { fontStyle: "bold" } },
  });
  y = lastY() + 22;

  if (s.alerts.length > 0) {
    heading("Readings to discuss with your doctor");
    bullets(s.alerts.map((al) => `${al.level === "alert" ? "[Alert] " : "[Watch] "}${al.message}`));
  }

  if (report.insights.length > 0) {
    heading("Insights");
    bullets(report.insights);
  }

  heading(`Check-in history (${report.records.length})`);
  if (report.records.length === 0) {
    paragraph("No check-ins recorded in this period.", 9.5, GRAY);
  } else {
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      theme: "striped",
      styles: { ...tableDefaults.styles, fontSize: 7.5, cellPadding: 3 },
      head: [["Date", "Score", "Weight", "BMI", "BP", "HR", "Temp", "Sugar", "Sleep", "Water", "Activity"]],
      body: report.records.map((r) => [
        date(r.recorded_at, true),
        n(r.wellness_score),
        n(r.weight_kg, 1),
        n(r.bmi, 1),
        bp(r.systolic_bp, r.diastolic_bp),
        n(r.heart_rate),
        n(r.body_temperature_c, 1),
        n(r.blood_sugar_mgdl),
        n(r.sleep_hours, 1),
        n(r.water_intake_liters, 1),
        n(r.activity_minutes),
      ]),
    });
    y = lastY() + 22;
  }

  heading(`Symptom checks (${report.symptom_checks.length})`);
  if (report.symptom_checks.length === 0) {
    paragraph("No symptom checks in this period.", 9.5, GRAY);
  } else {
    autoTable(doc, {
      ...tableDefaults,
      startY: y,
      theme: "striped",
      head: [["Date", "Symptoms", "Duration", "Severity", "Guidance level"]],
      body: report.symptom_checks.map((c) => [
        date(c.created_at, true),
        ascii(c.symptoms.map((x) => x.label).join(", ")),
        label(c.duration),
        label(c.severity),
        label(c.urgency_level),
      ]),
      columnStyles: { 1: { cellWidth: 190 } },
    });
    y = lastY() + 22;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text("For informational purposes only. Not a medical diagnosis. In an emergency, call your local emergency number.", M, H - 24);
    doc.text(`Page ${i} of ${pages}`, W - M, H - 24, { align: "right" });
  }

  const stamp = report.generated_at.slice(0, 10);
  doc.save(`health-report-${stamp}.pdf`);
}
