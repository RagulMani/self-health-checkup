import { useEffect, useMemo, useRef, useState } from "react";

import { fmt, shortDate, wellnessStroke } from "@/lib/health-format";

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  values: (number | null)[];
  decimals?: number;
  unit?: string;
}

interface TrendChartProps {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  emptyText?: string;
  bands?: { from: number; to: number; color: string }[];
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(240, el.clientWidth));
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

function niceStep(range: number, ticks: number): number {
  const raw = range / Math.max(1, ticks);
  const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10;
  return step * mag;
}

export function TrendChart({ labels, series, height = 220, emptyText = "No data yet", bands }: TrendChartProps) {
  const { ref, width } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const pad = { top: 12, right: 12, bottom: 28, left: 40 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const { min, max, ticks, hasData } = useMemo(() => {
    const all = series.flatMap((s) => s.values.filter((v): v is number => v != null));
    if (all.length === 0) return { min: 0, max: 1, ticks: [] as number[], hasData: false };
    let lo = Math.min(...all);
    let hi = Math.max(...all);
    if (lo === hi) {
      lo -= Math.max(1, Math.abs(lo) * 0.1);
      hi += Math.max(1, Math.abs(hi) * 0.1);
    }
    const step = niceStep(hi - lo, 4);
    lo = Math.floor(lo / step) * step;
    hi = Math.ceil(hi / step) * step;
    const t: number[] = [];
    for (let v = lo; v <= hi + step / 2; v += step) t.push(Number(v.toFixed(6)));
    return { min: lo, max: hi, ticks: t, hasData: true };
  }, [series]);

  const n = labels.length;
  const x = (i: number) => pad.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - ((v - min) / (max - min || 1)) * innerH;

  const labelEvery = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(innerW / 70))));

  function pathFor(values: (number | null)[]): string {
    let d = "";
    let pen = false;
    values.forEach((v, i) => {
      if (v == null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)} `;
      pen = true;
    });
    return d;
  }

  function onMove(e: React.MouseEvent<SVGSVGElement>) {
    if (n === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const idx = n <= 1 ? 0 : Math.round(((px - pad.left) / innerW) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, idx)));
  }

  if (!hasData) {
    return (
      <div
        ref={ref}
        className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
        style={{ height }}
      >
        {emptyText}
      </div>
    );
  }

  const tooltipLeft = hover != null ? Math.min(Math.max(x(hover), 70), width - 70) : 0;

  return (
    <div ref={ref} className="relative w-full">
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={series.map((s) => s.label).join(", ") + " trend chart"}
      >
        {bands?.map((b, i) => {
          const top = y(Math.min(max, b.to));
          const bottom = y(Math.max(min, b.from));
          if (bottom <= top) return null;
          return <rect key={i} x={pad.left} y={top} width={innerW} height={bottom - top} fill={b.color} />;
        })}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#E5E7EB" strokeWidth={1} />
            <text x={pad.left - 6} y={y(t) + 4} textAnchor="end" fontSize={11} fill="#6B7280">
              {fmt(t, 1)}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={l + i} x={x(i)} y={height - 8} textAnchor="middle" fontSize={11} fill="#6B7280">
              {shortDate(l)}
            </text>
          ) : null
        )}
        {hover != null && (
          <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="#9CA3AF" strokeDasharray="3 3" />
        )}
        {series.map((s) => (
          <g key={s.key}>
            <path d={pathFor(s.values)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {s.values.map((v, i) =>
              v == null ? null : (
                <circle
                  key={i}
                  cx={x(i)}
                  cy={y(v)}
                  r={hover === i ? 4.5 : n > 40 ? 0 : 2.5}
                  fill="#fff"
                  stroke={s.color}
                  strokeWidth={2}
                />
              )
            )}
          </g>
        ))}
      </svg>
      {hover != null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border bg-background px-2.5 py-1.5 text-xs shadow-sm"
          style={{ left: tooltipLeft }}
        >
          <div className="mb-0.5 font-medium">{shortDate(labels[hover])}</div>
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
              <span className="text-muted-foreground">{s.label}:</span>
              <span className="font-medium">
                {fmt(s.values[hover], s.decimals ?? 1)} {s.values[hover] != null ? s.unit : ""}
              </span>
            </div>
          ))}
        </div>
      )}
      {series.length > 1 && (
        <div className="mt-1 flex flex-wrap gap-3 px-1 text-xs text-muted-foreground">
          {series.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface ScoreRingProps {
  score: number | null;
  size?: number;
  label?: string | null;
}

export function ScoreRing({ score, size = 132, label }: ScoreRingProps) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score == null ? 0 : Math.max(0, Math.min(100, score)) / 100;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={wellnessStroke(score)}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-semibold tabular-nums">{score == null ? "—" : Math.round(score)}</span>
        <span className="text-xs text-muted-foreground">{label ?? "No data"}</span>
      </div>
    </div>
  );
}

interface BarsProps {
  labels: string[];
  values: (number | null)[];
  color?: string;
  height?: number;
  unit?: string;
  goal?: number;
}

export function MiniBars({ labels, values, color = "#14AABF", height = 120, unit = "", goal }: BarsProps) {
  const max = Math.max(goal ?? 0, ...values.map((v) => v ?? 0), 1);
  if (values.every((v) => v == null)) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground" style={{ height }}>
        No data yet
      </div>
    );
  }
  return (
    <div className="relative flex items-end gap-1" style={{ height }}>
      {goal != null && (
        <div
          className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-gray-300"
          style={{ bottom: `${(goal / max) * 100}%` }}
        />
      )}
      {values.map((v, i) => (
        <div key={labels[i] + i} className="group relative flex h-full flex-1 flex-col justify-end">
          <div
            className="w-full rounded-t-sm"
            style={{ height: `${((v ?? 0) / max) * 100}%`, background: v == null ? "transparent" : color, minHeight: v ? 2 : 0 }}
          />
          <div className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded border bg-background px-1.5 py-0.5 text-[11px] shadow-sm group-hover:block">
            {shortDate(labels[i])}: {fmt(v, 1)} {v != null ? unit : ""}
          </div>
        </div>
      ))}
    </div>
  );
}
