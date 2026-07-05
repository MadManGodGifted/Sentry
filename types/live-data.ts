export type ProviderStatus = "loading" | "success" | "empty" | "offline" | "error" | "missing-auth";

export type ProviderState = {
  id: string;
  label: string;
  status: ProviderStatus;
  updatedAt: string | null;
  message?: string;
};

export type LiveSatellite = {
  id: string;
  name: string;
  provider: string;
  latitude?: number;
  longitude?: number;
  altitudeKm?: number;
  velocityKps?: number;
  signal?: number;
  status: "nominal" | "tracking" | "warning" | "critical";
  tle?: string[];
};

export type LiveAlert = {
  id: string;
  source: string;
  severity: "info" | "warning" | "critical";
  title: string;
  detail: string;
  at: string;
};

export type LiveTimelineEvent = {
  id: string;
  source: string;
  kind: "launch" | "natural-event" | "space-weather" | "mission" | "iss";
  title: string;
  detail: string;
  at: string;
};

export type LiveMetric = {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  source: string;
  at: string;
};

export type LiveChartSeries = {
  id: string;
  label: string;
  points: Array<{ x: string; y: number }>;
};

export type LiveWeather = {
  id: string;
  location: string;
  temperatureC?: number;
  windKph?: number;
  pressureHpa?: number;
  cloudCover?: number;
  at: string;
};

export type LiveImagery = {
  id: string;
  source: string;
  title: string;
  url?: string;
  at: string;
};

export type LiveDataSnapshot = {
  providers: ProviderState[];
  metrics: LiveMetric[];
  satellites: LiveSatellite[];
  alerts: LiveAlert[];
  timeline: LiveTimelineEvent[];
  weather: LiveWeather[];
  imagery: LiveImagery[];
  charts: LiveChartSeries[];
  updatedAt: string | null;
};

export type LiveDataProvider = {
  id: string;
  label: string;
  getTelemetry: () => Promise<LiveMetric[]>;
  getSatellites: () => Promise<LiveSatellite[]>;
  getAlerts: () => Promise<LiveAlert[]>;
  getWeather: () => Promise<LiveWeather[]>;
  getTimeline: () => Promise<LiveTimelineEvent[]>;
  getImagery: () => Promise<LiveImagery[]>;
  getCharts: () => Promise<LiveChartSeries[]>;
};
