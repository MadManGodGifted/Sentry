"use client";

import dayjs from "dayjs";
import { TechnicalChart } from "@/components/charts/technical-chart";
import { ObjectInspector } from "@/components/inspectors/object-inspector";
import { OrbitalVisualization } from "@/components/maps/orbital-visualization";
import { EventTimeline } from "@/components/timeline/event-timeline";
import { DataState } from "@/components/visualization/data-state";
import { useAppStore } from "@/store/app.store";
import type { AppSection } from "@/types/app";
import type { LiveAlert, LiveChartSeries, LiveDataSnapshot, LiveMetric, LiveSatellite, LiveTimelineEvent } from "@/types/live-data";
import type { Workspace } from "@/types/workspace";

type WorkspaceViewProps = {
  activeSection: AppSection;
  activeWorkspace: Workspace | null;
  onCreateWorkspace: (name?: string) => void;
  onRunCommand: (command: string) => void;
  onUpdateSetting: (key: "echoCommands" | "compactConsole" | "preserveLayout", value: boolean) => void;
  settings: Record<"echoCommands" | "compactConsole" | "preserveLayout", boolean>;
  terminalHistory: string[];
};

function providersFor(data: LiveDataSnapshot | null, prefix: string) {
  return data?.providers.filter((provider) => provider.id.includes(prefix) || provider.label.toLowerCase().includes(prefix)) ?? [];
}

function metric(data: LiveDataSnapshot | null, source: string) {
  return data?.metrics.filter((item) => item.source.toLowerCase().includes(source)) ?? [];
}

function eventSource(data: LiveDataSnapshot | null, source: string) {
  return data?.timeline.filter((event) => event.source.toLowerCase().includes(source)) ?? [];
}

function ChartFromMetrics({ metrics, title }: { metrics: LiveMetric[]; title: string }) {
  const series: LiveChartSeries[] = metrics.map((item, index) => ({
    id: item.id,
    label: item.label,
    points: [
      { x: "T-2", y: Number(item.value) * 0.82 || index + 1 },
      { x: "T-1", y: Number(item.value) * 0.94 || index + 2 },
      { x: "NOW", y: Number(item.value) || index + 3 }
    ]
  }));
  return <TechnicalChart series={series} title={title} />;
}

export function WorkspaceView({ activeSection, activeWorkspace, onCreateWorkspace, onRunCommand, onUpdateSetting, settings, terminalHistory }: WorkspaceViewProps) {
  const liveData = useAppStore((state) => state.liveData);
  const selectedSatelliteId = useAppStore((state) => state.selectedSatelliteId);
  const selectSatellite = useAppStore((state) => state.selectSatellite);
  const setActiveWorkspace = useAppStore((state) => state.setActiveWorkspace);
  const selectedSatellite = liveData?.satellites.find((satellite) => satellite.id === selectedSatelliteId) ?? liveData?.satellites[0] ?? null;

  if (activeSection === "Research") {
    return <AsteroidWorkspace liveData={liveData} />;
  }

  if (activeSection === "Projects") {
    return (
      <SatelliteTrackingWorkspace
        liveData={liveData}
        onSelectSatellite={selectSatellite}
        selectedSatellite={selectedSatellite}
        selectedSatelliteId={selectedSatelliteId}
      />
    );
  }

  if (activeSection === "Timeline") {
    return <LaunchMonitorWorkspace liveData={liveData} />;
  }

  if (activeSection === "Capture") {
    return <EarthObservationWorkspace liveData={liveData} />;
  }

  if (activeSection === "Knowledge") {
    return <SpaceWeatherWorkspace liveData={liveData} />;
  }

  if (activeSection === "Analysis") {
    return <AnalyticsWorkspace liveData={liveData} />;
  }

  if (activeSection === "Settings") {
    return (
      <ConfigWorkspace
        activeWorkspace={activeWorkspace}
        onCreateWorkspace={onCreateWorkspace}
        onRunCommand={onRunCommand}
        onUpdateSetting={onUpdateSetting}
        settings={settings}
        terminalHistory={terminalHistory}
      />
    );
  }

  return (
    <MissionWorkspace liveData={liveData} onOpenGraph={() => setActiveWorkspace("analytics")} onOpenTrack={() => setActiveWorkspace("satellite-tracking")} />
  );
}

function AsteroidWorkspace({ liveData }: { liveData: LiveDataSnapshot | null }) {
  const neoMetrics = metric(liveData, "neows");
  const neoEvents = eventSource(liveData, "neows");
  const neoAlerts = liveData?.alerts.filter((alert) => alert.source.toLowerCase().includes("neows")) ?? [];
  const velocitySeries: LiveChartSeries[] = [
    {
      id: "neo-velocity",
      label: "CLOSE APPROACH INDEX",
      points: neoEvents.slice(0, 10).map((event, index) => ({ x: dayjs(event.at).format("HH:mm"), y: index + 1 }))
    }
  ];

  return (
    <WorkspaceFrame title="ASTEROID INTELLIGENCE" subtitle="NASA NEOWS">
      <DataState count={neoEvents.length + neoMetrics.length} label="NEOWS" providers={providersFor(liveData, "neows")}>
        <StatsStrip metrics={neoMetrics} />
        <div className="workspace-grid two-one">
          <TechnicalTable
            columns={["OBJECT", "APPROACH", "MISS DISTANCE", "RISK"]}
            rows={neoEvents.map((event) => [event.title, dayjs(event.at).format("MMM DD HH:mm"), event.detail, neoAlerts.some((alert) => alert.title === event.title) ? "WATCH" : "LOW"])}
            title="TODAY'S NEAR EARTH OBJECTS"
          />
          <ThreatGauge alerts={neoAlerts} total={neoEvents.length} />
        </div>
        <div className="workspace-grid equal">
          <TechnicalChart series={velocitySeries} title="VELOCITY / APPROACH CHART" />
          <EventTimeline events={neoEvents} title="CLOSE APPROACH TIMELINE" />
        </div>
      </DataState>
    </WorkspaceFrame>
  );
}

function SatelliteTrackingWorkspace({
  liveData,
  onSelectSatellite,
  selectedSatellite,
  selectedSatelliteId
}: {
  liveData: LiveDataSnapshot | null;
  onSelectSatellite: (satelliteId: string) => void;
  selectedSatellite: LiveSatellite | null;
  selectedSatelliteId: string | null;
}) {
  const satellites = liveData?.satellites ?? [];
  const asteroidTracks = eventSource(liveData, "neows");

  return (
    <WorkspaceFrame title="SATELLITE TRACKING" subtitle="ISS / STARLINK / CATALOG">
      <DataState count={satellites.length} label="SATELLITE TRACK" providers={[...providersFor(liveData, "iss"), ...providersFor(liveData, "spacex"), ...providersFor(liveData, "satellite")]}>
        <div className="workspace-grid two-one tall">
          <OrbitalVisualization asteroids={asteroidTracks} onSelectSatellite={onSelectSatellite} satellites={satellites} selectedSatelliteId={selectedSatelliteId} />
          <ObjectInspector alerts={liveData?.alerts ?? []} object={selectedSatellite} />
        </div>
        <TechnicalTable
          columns={["SATELLITE", "PROVIDER", "ALT", "VEL", "LAT", "LON"]}
          rows={satellites.slice(0, 10).map((satellite) => [
            satellite.name,
            satellite.provider,
            satellite.altitudeKm ? `${Math.round(satellite.altitudeKm)} KM` : "--",
            satellite.velocityKps ? `${satellite.velocityKps.toFixed(2)} KPS` : "--",
            satellite.latitude?.toFixed(2) ?? "--",
            satellite.longitude?.toFixed(2) ?? "--"
          ])}
          title="LIVE SATELLITES"
        />
      </DataState>
    </WorkspaceFrame>
  );
}

function LaunchMonitorWorkspace({ liveData }: { liveData: LiveDataSnapshot | null }) {
  const launches = liveData?.timeline.filter((event) => event.kind === "launch") ?? [];

  return (
    <WorkspaceFrame title="LAUNCH MONITOR" subtitle="SPACEX LAUNCH TIMELINE">
      <DataState count={launches.length} label="LAUNCHES" providers={providersFor(liveData, "spacex")}>
        <StatsStrip metrics={metric(liveData, "spacex")} />
        <div className="workspace-grid two-one">
          <EventTimeline events={launches} title="UPCOMING / PAST LAUNCHES" />
          <MissionCard event={launches[0] ?? null} />
        </div>
      </DataState>
    </WorkspaceFrame>
  );
}

function EarthObservationWorkspace({ liveData }: { liveData: LiveDataSnapshot | null }) {
  const naturalEvents = liveData?.timeline.filter((event) => event.kind === "natural-event") ?? [];
  const weatherRows = liveData?.weather.map((weather) => [
    weather.location,
    weather.temperatureC !== undefined ? `${weather.temperatureC} C` : "--",
    weather.windKph !== undefined ? `${weather.windKph} KPH` : "--",
    weather.pressureHpa !== undefined ? `${weather.pressureHpa} HPA` : "--",
    weather.cloudCover !== undefined ? `${weather.cloudCover}%` : "--"
  ]) ?? [];

  return (
    <WorkspaceFrame title="EARTH OBSERVATION" subtitle="USGS / EONET / OPEN-METEO">
      <DataState count={naturalEvents.length + weatherRows.length} label="EARTH DATA" providers={[...providersFor(liveData, "earth"), ...providersFor(liveData, "eonet")]}>
        <div className="workspace-grid equal">
          <EventTimeline events={naturalEvents} title="NATURAL EVENT TIMELINE" />
          <TechnicalTable columns={["REGION", "TEMP", "WIND", "PRESS", "CLOUD"]} rows={weatherRows} title="GLOBAL CONDITIONS" />
        </div>
        <SeverityCards alerts={liveData?.alerts.filter((alert) => alert.source.includes("USGS") || alert.source.includes("EONET")) ?? []} />
      </DataState>
    </WorkspaceFrame>
  );
}

function AnalyticsWorkspace({ liveData }: { liveData: LiveDataSnapshot | null }) {
  return (
    <WorkspaceFrame title="ANALYTICS" subtitle="LIVE CHART MATRIX">
      <DataState count={liveData?.charts.length ?? 0} label="ANALYTICS" providers={liveData?.providers ?? []}>
        <div className="workspace-grid equal">
          <TechnicalChart series={liveData?.charts ?? []} title="PROVIDER CHARTS" />
          <ChartFromMetrics metrics={liveData?.metrics ?? []} title="LIVE METRICS" />
        </div>
        <TechnicalTable
          columns={["METRIC", "VALUE", "SOURCE", "TIME"]}
          rows={(liveData?.metrics ?? []).slice(0, 12).map((item) => [item.label, `${item.value}${item.unit ?? ""}`, item.source, dayjs(item.at).format("HH:mm:ss")])}
          title="METRIC INDEX"
        />
      </DataState>
    </WorkspaceFrame>
  );
}

function MissionWorkspace({ liveData, onOpenGraph, onOpenTrack }: { liveData: LiveDataSnapshot | null; onOpenGraph: () => void; onOpenTrack: () => void }) {
  return (
    <WorkspaceFrame title="MISSION OVERVIEW" subtitle="LIVE OPERATIONS">
      <StatsStrip metrics={(liveData?.metrics ?? []).slice(0, 6)} />
      <div className="workspace-grid equal">
        <EventTimeline events={(liveData?.timeline ?? []).slice(0, 12)} title="CHRONOLOGICAL FEED" />
        <ProviderMatrix liveData={liveData} />
      </div>
      <div className="mission-actions">
        <button onClick={onOpenTrack} type="button">OPEN TRACK</button>
        <button onClick={onOpenGraph} type="button">OPEN GRAPH</button>
      </div>
    </WorkspaceFrame>
  );
}

type ConfigWorkspaceProps = Pick<WorkspaceViewProps, "activeWorkspace" | "onCreateWorkspace" | "onRunCommand" | "onUpdateSetting" | "settings" | "terminalHistory">;

function ConfigWorkspace({
  activeWorkspace,
  onCreateWorkspace,
  onRunCommand,
  onUpdateSetting,
  settings,
  terminalHistory
}: ConfigWorkspaceProps) {
  return (
    <WorkspaceFrame title="CONFIG" subtitle="WORKSPACE CONFIGURATION">
      <div className="workspace-grid equal">
        <section className="viz-panel">
          <header>
            <span>WORKSPACE</span>
            <strong>{activeWorkspace?.name ?? "NONE"}</strong>
          </header>
          <button onClick={() => onCreateWorkspace()} type="button">CREATE WORKSPACE</button>
          <button onClick={() => onRunCommand("providers")} type="button">QUERY PROVIDERS</button>
        </section>
        <section className="viz-panel">
          <header>
            <span>LOCAL SETTINGS</span>
            <strong>CONFIG</strong>
          </header>
          {(Object.keys(settings) as Array<keyof typeof settings>).map((key) => (
            <label className="config-toggle" key={key}>
              <span>{key.toUpperCase()}</span>
              <input checked={settings[key]} onChange={(event) => onUpdateSetting(key, event.target.checked)} type="checkbox" />
            </label>
          ))}
        </section>
      </div>
      <TechnicalTable columns={["LOG"]} rows={terminalHistory.slice(-8).map((line) => [line])} title="RECENT CONSOLE" />
    </WorkspaceFrame>
  );
}

function SpaceWeatherWorkspace({ liveData }: { liveData: LiveDataSnapshot | null }) {
  const events = liveData?.timeline.filter((event) => event.kind === "space-weather") ?? [];
  return (
    <WorkspaceFrame title="SPACE WEATHER" subtitle="DONKI / NOAA SWPC">
      <DataState count={events.length + metric(liveData, "swpc").length} label="SPACE WEATHER" providers={[...providersFor(liveData, "donki"), ...providersFor(liveData, "solar")]}>
        <StatsStrip metrics={[...metric(liveData, "donki"), ...metric(liveData, "swpc")]} />
        <div className="workspace-grid equal">
          <EventTimeline events={events} title="SOLAR EVENT TIMELINE" />
          <TechnicalChart series={(liveData?.charts ?? []).filter((chart) => chart.label.includes("KP") || chart.label.includes("SOLAR"))} title="KP / SOLAR WIND" />
        </div>
      </DataState>
    </WorkspaceFrame>
  );
}

function WorkspaceFrame({ children, subtitle, title }: { children: React.ReactNode; subtitle: string; title: string }) {
  return (
    <section className="workspace-live-view">
      <header className="workspace-live-header">
        <span>{title}</span>
        <strong>{subtitle}</strong>
      </header>
      {children}
    </section>
  );
}

function StatsStrip({ metrics }: { metrics: LiveMetric[] }) {
  return (
    <div className="viz-stats-strip">
      {metrics.slice(0, 6).map((metric) => (
        <section key={metric.id}>
          <span>{metric.label}</span>
          <strong>
            {metric.value}
            {metric.unit ?? ""}
          </strong>
          <small>{metric.source}</small>
        </section>
      ))}
      {!metrics.length ? (
        <section>
          <span>METRICS</span>
          <strong>EMPTY</strong>
          <small>NO PROVIDER VALUES</small>
        </section>
      ) : null}
    </div>
  );
}

function TechnicalTable({ columns, rows, title }: { columns: string[]; rows: string[][]; title: string }) {
  return (
    <section className="viz-table-frame">
      <header>
        <span>{title}</span>
        <strong>{rows.length} ROW</strong>
      </header>
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.slice(0, 12).map((row, index) => (
            <tr key={`${row.join("-")}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ThreatGauge({ alerts, total }: { alerts: LiveAlert[]; total: number }) {
  const ratio = total ? Math.min((alerts.length / total) * 100, 100) : 0;
  return (
    <section className="viz-gauge-frame">
      <header>
        <span>THREAT GAUGE</span>
        <strong>{alerts.length ? "WATCH" : "LOW"}</strong>
      </header>
      <div style={{ "--gauge": `${ratio}%` } as React.CSSProperties} />
      <p>{alerts.length} hazardous/watch objects from {total} approaches.</p>
    </section>
  );
}

function MissionCard({ event }: { event: LiveTimelineEvent | null }) {
  return (
    <section className="viz-panel">
      <header>
        <span>MISSION DETAIL</span>
        <strong>{event ? dayjs(event.at).format("HH:mm") : "NO EVT"}</strong>
      </header>
      <h3>{event?.title ?? "NO LAUNCH EVENT"}</h3>
      <p>{event?.detail ?? "Provider returned no launch timeline."}</p>
      <small>{event?.source ?? "SPACEX API"}</small>
    </section>
  );
}

function SeverityCards({ alerts }: { alerts: LiveAlert[] }) {
  return (
    <div className="severity-card-grid">
      {alerts.slice(0, 6).map((alert) => (
        <section className={`severity-card ${alert.severity}`} key={alert.id}>
          <span>{alert.severity.toUpperCase()}</span>
          <strong>{alert.title}</strong>
          <p>{alert.detail}</p>
        </section>
      ))}
    </div>
  );
}

function ProviderMatrix({ liveData }: { liveData: LiveDataSnapshot | null }) {
  return (
    <section className="viz-table-frame">
      <header>
        <span>PROVIDER MATRIX</span>
        <strong>{liveData?.providers.length ?? 0} SRC</strong>
      </header>
      <div className="provider-matrix">
        {(liveData?.providers ?? []).map((provider) => (
          <section key={provider.id}>
            <span>{provider.label}</span>
            <strong>{provider.status.toUpperCase()}</strong>
          </section>
        ))}
      </div>
    </section>
  );
}
