"use client";

import dayjs from "dayjs";
import type { CSSProperties } from "react";
import type { LiveAlert, LiveChartSeries, LiveDataSnapshot, LiveMetric, LiveTimelineEvent, LiveWeather, ProviderState } from "@/types/live-data";

type Point = { x: number; y: number };

function project(latitude?: number, longitude?: number): Point | null {
  if (latitude === undefined || longitude === undefined || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return null;
  }

  return {
    x: Math.min(Math.max(((longitude + 180) / 360) * 100, 3), 97),
    y: Math.min(Math.max(((90 - latitude) / 180) * 100, 5), 95)
  };
}

function numericMetric(metric: LiveMetric) {
  const value = Number(metric.value);
  return Number.isFinite(value) ? value : 0;
}

function normalize(value: number, max: number) {
  return max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
}

function linePath(series: LiveChartSeries, width = 300, height = 96) {
  const values = series.points.map((point) => point.y);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = Math.max(max - min, 1);
  return series.points
    .map((point, index) => {
      const x = series.points.length <= 1 ? 0 : (index / (series.points.length - 1)) * width;
      const y = height - ((point.y - min) / span) * (height - 12) - 6;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function EmptyVisualization({ label, status = "AWAITING LIVE DATA" }: { label: string; status?: string }) {
  return (
    <section className="viz-diagnostic-frame">
      <header>
        <span>{label}</span>
        <strong>{status}</strong>
      </header>
      <div className="viz-diagnostic-grid">
        <i />
        <i />
        <i />
      </div>
      <p>Provider stream has no renderable frame. Sentry will update this panel when live data returns.</p>
    </section>
  );
}

export function EarthMonitoringMap({ alerts, events, weather }: { alerts: LiveAlert[]; events: LiveTimelineEvent[]; weather: LiveWeather[] }) {
  const plottedEvents = events.map((event) => ({ event, point: project(event.latitude, event.longitude) })).filter((item): item is { event: LiveTimelineEvent; point: Point } => Boolean(item.point));
  const weatherCells = weather.map((cell) => ({ cell, point: project(cell.latitude, cell.longitude) })).filter((item): item is { cell: LiveWeather; point: Point } => Boolean(item.point));

  if (!plottedEvents.length && !weatherCells.length) {
    return <EmptyVisualization label="EARTH MONITOR" />;
  }

  return (
    <section className="viz-earth-map">
      <header>
        <span>EARTH EVENT MAP</span>
        <strong>{plottedEvents.length} GEO / {weatherCells.length} WX</strong>
      </header>
      <svg viewBox="0 0 420 220" role="img" aria-label="Live Earth monitoring map">
        <path className="map-equator" d="M14 110 H406" />
        <path className="map-meridian" d="M210 16 V204" />
        {[0, 1, 2, 3].map((index) => (
          <ellipse className="map-grid-ring" cx="210" cy="110" key={index} rx={190 - index * 38} ry={88 - index * 14} />
        ))}
        {weatherCells.map(({ cell, point }) => (
          <g className="weather-cell" key={cell.id} style={{ "--cloud": `${cell.cloudCover ?? 0}%` } as CSSProperties}>
            <circle cx={(point.x / 100) * 420} cy={(point.y / 100) * 220} r={7 + normalize(cell.windKph ?? 0, 80) * 8} />
            <text x={(point.x / 100) * 420 + 10} y={(point.y / 100) * 220 - 5}>{cell.location.slice(0, 18)}</text>
          </g>
        ))}
        {plottedEvents.slice(0, 24).map(({ event, point }) => (
          <g className={`earth-event ${event.source.includes("USGS") ? "quake" : "eonet"}`} key={event.id}>
            <circle cx={(point.x / 100) * 420} cy={(point.y / 100) * 220} r={event.magnitude ? 3 + event.magnitude : 5} />
            <text x={(point.x / 100) * 420 + 8} y={(point.y / 100) * 220 + 12}>{event.title.slice(0, 20)}</text>
          </g>
        ))}
      </svg>
      <footer>
        <span>UNPLOTTED {Math.max(events.length - plottedEvents.length, 0)}</span>
        <strong>ALERTS {alerts.length}</strong>
      </footer>
    </section>
  );
}

export function AsteroidTrajectory({ alerts, events }: { alerts: LiveAlert[]; events: LiveTimelineEvent[] }) {
  if (!events.length && !alerts.length) {
    return <EmptyVisualization label="NEO TRAJECTORY" />;
  }

  return (
    <section className="viz-asteroid-track">
      <header>
        <span>NEO TRAJECTORY PREVIEW</span>
        <strong>{events.length} APPROACH</strong>
      </header>
      <svg viewBox="0 0 420 220" role="img" aria-label="Near Earth object trajectory preview">
        <circle className="trajectory-earth" cx="210" cy="112" r="27" />
        {events.slice(0, 9).map((event, index) => {
          const offset = index * 13;
          const critical = alerts.some((alert) => alert.title === event.title && alert.severity !== "info");
          return (
            <g className={critical ? "asteroid-path critical" : "asteroid-path"} key={event.id}>
              <path d={`M ${24 + offset} ${34 + index * 4} C ${118 + offset} ${188 - index * 6}, ${282 - offset} ${16 + index * 13}, ${396 - offset} ${170 - index * 7}`} />
              <circle cx={296 - offset * 0.42} cy={60 + index * 13} r={critical ? 5 : 3.5} />
              <text x={36 + offset} y={34 + index * 4}>{event.title.slice(0, 18)}</text>
            </g>
          );
        })}
      </svg>
      <footer>
        <span>{alerts[0]?.detail ?? "MISS DISTANCE STREAM NOMINAL"}</span>
        <strong>{dayjs(events[0]?.at).isValid() ? dayjs(events[0]?.at).format("HH:mm UTC") : "NO VECTOR"}</strong>
      </footer>
    </section>
  );
}

export function TelemetryVisualization({ charts, metrics }: { charts: LiveChartSeries[]; metrics: LiveMetric[] }) {
  const numeric = metrics.filter((metric) => Number.isFinite(Number(metric.value))).slice(0, 6);
  if (!charts.length && !numeric.length) {
    return <EmptyVisualization label="TELEMETRY STREAM" />;
  }

  const maxMetric = Math.max(...numeric.map(numericMetric), 1);

  return (
    <section className="viz-telemetry-stream">
      <header>
        <span>MISSION TELEMETRY STREAM</span>
        <strong>{charts.length} SERIES / {numeric.length} METRIC</strong>
      </header>
      <svg viewBox="0 0 420 220" role="img" aria-label="Live telemetry visualization">
        <g className="telemetry-grid">
          {[32, 74, 116, 158, 200].map((y) => <path d={`M 16 ${y} H 404`} key={y} />)}
        </g>
        {charts.slice(0, 4).map((chart, index) => (
          <path className={`telemetry-line line-${index}`} d={linePath(chart, 380, 132)} key={chart.id} transform="translate(20 22)" />
        ))}
        {numeric.map((metric, index) => {
          const value = normalize(numericMetric(metric), maxMetric);
          return (
            <g className="telemetry-bar" key={metric.id} transform={`translate(${32 + index * 60} 172)`}>
              <rect height={Math.max(value * 48, 3)} width="24" x="0" y={-Math.max(value * 48, 3)} />
              <text x="0" y="18">{metric.label.slice(0, 7)}</text>
            </g>
          );
        })}
      </svg>
    </section>
  );
}

export function SolarWeatherVisualization({ alerts, charts, events, metrics }: { alerts: LiveAlert[]; charts: LiveChartSeries[]; events: LiveTimelineEvent[]; metrics: LiveMetric[] }) {
  const kp = metrics.find((metric) => metric.label.includes("KP"));
  const wind = metrics.find((metric) => metric.label.includes("WIND"));
  const kpValue = kp ? Number(kp.value) : 0;

  if (!metrics.length && !charts.length && !events.length) {
    return <EmptyVisualization label="SOLAR WEATHER" />;
  }

  return (
    <section className="viz-solar-weather">
      <header>
        <span>SOLAR PARTICLE FRAME</span>
        <strong>KP {Number.isFinite(kpValue) ? kpValue : "--"} / {alerts.length} ALERT</strong>
      </header>
      <svg viewBox="0 0 420 220" role="img" aria-label="Solar weather visualization">
        <circle className="solar-core" cx="106" cy="110" r="34" />
        {[0, 1, 2, 3, 4].map((index) => (
          <path className="solar-particle" d={`M ${142 + index * 3} ${68 + index * 15} C ${218 + index * 8} ${42 + index * 20}, ${272} ${176 - index * 18}, ${388} ${72 + index * 24}`} key={index} />
        ))}
        {charts.slice(0, 2).map((chart, index) => (
          <path className={`solar-chart line-${index}`} d={linePath(chart, 210, 66)} key={chart.id} transform={`translate(182 ${128 + index * 36})`} />
        ))}
      </svg>
      <footer>
        <span>{wind ? `${wind.label} ${wind.value}${wind.unit ?? ""}` : "SOLAR WIND --"}</span>
        <strong>{events[0]?.title ?? "DONKI/NOAA NOMINAL"}</strong>
      </footer>
    </section>
  );
}

export function LaunchTrajectory({ launches, providers }: { launches: LiveTimelineEvent[]; providers: ProviderState[] }) {
  const nextLaunch = launches.find((launch) => dayjs(launch.at).isAfter(dayjs())) ?? launches[0];
  const provider = providers[0];

  if (!launches.length) {
    return <EmptyVisualization label="LAUNCH TRAJECTORY" status={provider ? provider.status.toUpperCase() : "NO PROVIDER FRAME"} />;
  }

  return (
    <section className="viz-launch-trajectory">
      <header>
        <span>LAUNCH TRAJECTORY</span>
        <strong>{nextLaunch ? dayjs(nextLaunch.at).format("MMM DD HH:mm") : "NO WINDOW"}</strong>
      </header>
      <svg viewBox="0 0 420 168" role="img" aria-label="Live launch timeline trajectory">
        <path className="launch-arc" d="M 32 136 C 112 36, 254 20, 386 42" />
        <circle className="launch-pad" cx="32" cy="136" r="9" />
        {launches.slice(0, 8).map((launch, index) => (
          <g className="launch-node" key={launch.id} transform={`translate(${54 + index * 46} ${124 - index * 11})`}>
            <circle r={index === 0 ? 5 : 3.5} />
            <text x="-18" y="18">{launch.title.slice(0, 9)}</text>
          </g>
        ))}
      </svg>
      <footer>
        <span>{nextLaunch?.title ?? "NO LAUNCH"}</span>
        <strong>{nextLaunch?.source ?? "SPACEX"}</strong>
      </footer>
    </section>
  );
}

export function MissionNetwork({ liveData }: { liveData: LiveDataSnapshot | null }) {
  const providers = liveData?.providers ?? [];
  const alerts = liveData?.alerts ?? [];
  const events = liveData?.timeline ?? [];

  if (!providers.length) {
    return <EmptyVisualization label="MISSION NETWORK" />;
  }

  return (
    <section className="viz-mission-network">
      <header>
        <span>LIVE PROVIDER NETWORK</span>
        <strong>{providers.filter((provider) => provider.status === "success").length}/{providers.length} ONLINE</strong>
      </header>
      <svg viewBox="0 0 420 220" role="img" aria-label="Live provider network">
        <circle className="network-core" cx="210" cy="110" r="28" />
        {providers.slice(0, 14).map((provider, index) => {
          const angle = (Math.PI * 2 * index) / Math.max(providers.length, 1) - Math.PI / 2;
          const x = 210 + Math.cos(angle) * 142;
          const y = 110 + Math.sin(angle) * 76;
          return (
            <g className={`network-node ${provider.status}`} key={provider.id}>
              <path d={`M 210 110 L ${x.toFixed(1)} ${y.toFixed(1)}`} />
              <circle cx={x} cy={y} r={provider.status === "success" ? 5 : 4} />
              <text x={x + 8} y={y + 3}>{provider.label.slice(0, 14)}</text>
            </g>
          );
        })}
      </svg>
      <footer>
        <span>EVENTS {events.length}</span>
        <strong>ALERTS {alerts.length}</strong>
      </footer>
    </section>
  );
}
