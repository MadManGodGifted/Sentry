"use client";

import type { LiveChartSeries } from "@/types/live-data";

type TechnicalChartProps = {
  series: LiveChartSeries[];
  title: string;
};

export function TechnicalChart({ series, title }: TechnicalChartProps) {
  const points = series.flatMap((item) => item.points);
  const max = Math.max(...points.map((point) => point.y), 1);
  const min = Math.min(...points.map((point) => point.y), 0);
  const span = Math.max(max - min, 1);

  return (
    <section className="viz-chart-frame">
      <header>
        <span>{title}</span>
        <strong>{series.length ? `${series.length} SERIES` : "EMPTY"}</strong>
      </header>
      <div className="viz-chart-grid">
        {series.slice(0, 4).map((item) => (
          <div className="viz-chart-series" key={item.id}>
            <span>{item.label}</span>
            <svg viewBox="0 0 220 72" role="img" aria-label={item.label}>
              <polyline
                points={item.points
                  .map((point, index) => {
                    const x = item.points.length <= 1 ? 0 : (index / (item.points.length - 1)) * 220;
                    const y = 68 - ((point.y - min) / span) * 62;
                    return `${x.toFixed(1)},${y.toFixed(1)}`;
                  })
                  .join(" ")}
              />
            </svg>
          </div>
        ))}
      </div>
    </section>
  );
}
