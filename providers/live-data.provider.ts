import { earthAdapter } from "@/adapters/earth.adapter";
import { issAdapter } from "@/adapters/iss.adapter";
import { nasaAdapter } from "@/adapters/nasa.adapter";
import { satelliteAdapter } from "@/adapters/satellite.adapter";
import { solarWeatherAdapter } from "@/adapters/solar-weather.adapter";
import { spacexAdapter } from "@/adapters/spacex.adapter";
import { weatherAdapter } from "@/adapters/weather.adapter";
import { isOfflineError } from "@/api/http";
import type { LiveDataProvider, LiveDataSnapshot, ProviderState } from "@/types/live-data";

function emptySnapshot(): LiveDataSnapshot {
  return {
    providers: [],
    metrics: [],
    satellites: [],
    alerts: [],
    timeline: [],
    weather: [],
    imagery: [],
    charts: [],
    updatedAt: null
  };
}

function providerState(id: string, label: string, status: ProviderState["status"], message?: string): ProviderState {
  return {
    id,
    label,
    status,
    updatedAt: status === "success" ? new Date().toISOString() : null,
    message
  };
}

function statusFromError(error: unknown): ProviderState["status"] {
  if (error instanceof Error && error.message.includes("NEXT_PUBLIC_NASA_API_KEY")) {
    return "missing-auth";
  }
  return isOfflineError(error) ? "offline" : "error";
}

async function safeProvider(provider: LiveDataProvider): Promise<LiveDataSnapshot> {
  const snapshot = emptySnapshot();
  try {
    const [metrics, satellites, alerts, weather, timeline, imagery, charts] = await Promise.all([
      provider.getTelemetry(),
      provider.getSatellites(),
      provider.getAlerts(),
      provider.getWeather(),
      provider.getTimeline(),
      provider.getImagery(),
      provider.getCharts()
    ]);
    snapshot.metrics = metrics;
    snapshot.satellites = satellites;
    snapshot.alerts = alerts;
    snapshot.weather = weather;
    snapshot.timeline = timeline;
    snapshot.imagery = imagery;
    snapshot.charts = charts;
    snapshot.updatedAt = new Date().toISOString();
    snapshot.providers = [
      providerState(
        provider.id,
        provider.label,
        metrics.length || satellites.length || alerts.length || weather.length || timeline.length || imagery.length || charts.length ? "success" : "empty"
      )
    ];
    return snapshot;
  } catch (error) {
    snapshot.providers = [providerState(provider.id, provider.label, statusFromError(error), error instanceof Error ? error.message : "Provider failed.")];
    return snapshot;
  }
}

type NasaTask = {
  id: string;
  label: string;
  run: () => Promise<Partial<LiveDataSnapshot>>;
};

function countPayload(payload: Partial<LiveDataSnapshot>) {
  return (
    (payload.metrics?.length ?? 0) +
    (payload.satellites?.length ?? 0) +
    (payload.alerts?.length ?? 0) +
    (payload.timeline?.length ?? 0) +
    (payload.weather?.length ?? 0) +
    (payload.imagery?.length ?? 0) +
    (payload.charts?.length ?? 0)
  );
}

async function safeNasaTask(task: NasaTask): Promise<LiveDataSnapshot> {
  const snapshot = emptySnapshot();
  try {
    const payload = await task.run();
    snapshot.metrics = payload.metrics ?? [];
    snapshot.satellites = payload.satellites ?? [];
    snapshot.alerts = payload.alerts ?? [];
    snapshot.timeline = payload.timeline ?? [];
    snapshot.weather = payload.weather ?? [];
    snapshot.imagery = payload.imagery ?? [];
    snapshot.charts = payload.charts ?? [];
    snapshot.updatedAt = new Date().toISOString();
    snapshot.providers = [providerState(task.id, task.label, countPayload(payload) ? "success" : "empty")];
    return snapshot;
  } catch (error) {
    snapshot.providers = [providerState(task.id, task.label, statusFromError(error), error instanceof Error ? error.message : "NASA endpoint failed.")];
    return snapshot;
  }
}

async function getNasaSnapshot(): Promise<LiveDataSnapshot> {
  const tasks: NasaTask[] = [
    {
      id: "nasa-neows",
      label: "NASA NeoWs",
      run: async () => {
        const neo = await nasaAdapter.getNearEarthObjects();
        return { metrics: neo.metrics, alerts: neo.alerts, timeline: neo.timeline };
      }
    },
    {
      id: "nasa-donki",
      label: "NASA DONKI",
      run: async () => {
        const donki = await nasaAdapter.getDonki();
        return { metrics: donki.metrics, alerts: donki.alerts, timeline: donki.timeline };
      }
    },
    {
      id: "nasa-apod",
      label: "NASA APOD",
      run: async () => ({ imagery: await nasaAdapter.getApod() })
    },
    {
      id: "nasa-epic",
      label: "NASA EPIC",
      run: async () => ({ imagery: await nasaAdapter.getEpicImagery() })
    },
    {
      id: "nasa-earth-assets",
      label: "NASA Earth Assets",
      run: async () => ({ imagery: await nasaAdapter.getEarthAssets() })
    },
    {
      id: "nasa-mars-rover",
      label: "NASA Mars Rover Photos",
      run: async () => ({ imagery: await nasaAdapter.getMarsRoverPhotos() })
    },
    {
      id: "nasa-techport",
      label: "NASA TechPort",
      run: async () => ({ metrics: await nasaAdapter.getTechPort() })
    },
    {
      id: "nasa-eonet",
      label: "NASA EONET",
      run: async () => {
        const eonet = await nasaAdapter.getEonet();
        return { alerts: eonet.alerts, timeline: eonet.timeline };
      }
    }
  ];

  const snapshots = await Promise.all(tasks.map((task) => safeNasaTask(task)));
  return snapshots.reduce<LiveDataSnapshot>(
    (merged, snapshot) => ({
      providers: [...merged.providers, ...snapshot.providers],
      metrics: [...merged.metrics, ...snapshot.metrics],
      satellites: [...merged.satellites, ...snapshot.satellites],
      alerts: [...merged.alerts, ...snapshot.alerts],
      timeline: [...merged.timeline, ...snapshot.timeline],
      weather: [...merged.weather, ...snapshot.weather],
      imagery: [...merged.imagery, ...snapshot.imagery],
      charts: [...merged.charts, ...snapshot.charts],
      updatedAt: new Date().toISOString()
    }),
    emptySnapshot()
  );
}

export const issProvider: LiveDataProvider = {
  id: "iss",
  label: "ISS",
  async getTelemetry() {
    const [position, crew] = await Promise.all([issAdapter.getPosition(), issAdapter.getCrew()]);
    return [...position.metrics, ...crew];
  },
  async getSatellites() {
    const position = await issAdapter.getPosition();
    return position.satellites;
  },
  async getAlerts() {
    return [];
  },
  async getWeather() {
    return [];
  },
  async getTimeline() {
    const position = await issAdapter.getPosition();
    return position.timeline;
  },
  async getImagery() {
    return [];
  },
  async getCharts() {
    return [];
  }
};

export const spacexProvider: LiveDataProvider = {
  id: "spacex",
  label: "SpaceX",
  getTelemetry: () => spacexAdapter.getTelemetry(),
  getSatellites: () => spacexAdapter.getStarlink(),
  async getAlerts() {
    const timeline = await spacexAdapter.getTimeline();
    return timeline.slice(0, 3).map((event) => ({
      id: `alert-${event.id}`,
      source: event.source,
      severity: "info",
      title: event.title,
      detail: event.detail,
      at: event.at
    }));
  },
  async getWeather() {
    return [];
  },
  getTimeline: () => spacexAdapter.getTimeline(),
  async getImagery() {
    return [];
  },
  async getCharts() {
    return [];
  }
};

export const earthProvider: LiveDataProvider = {
  id: "earth",
  label: "Earth Monitoring",
  async getTelemetry() {
    return [];
  },
  async getSatellites() {
    return [];
  },
  async getAlerts() {
    const [earthquakes, eonet] = await Promise.all([earthAdapter.getEarthquakes(), nasaAdapter.getEonet()]);
    return [...earthquakes.alerts, ...eonet.alerts];
  },
  async getWeather() {
    const weather = await weatherAdapter.getGlobalConditions();
    return weather.weather;
  },
  async getTimeline() {
    const [earthquakes, eonet] = await Promise.all([earthAdapter.getEarthquakes(), nasaAdapter.getEonet()]);
    return [...earthquakes.timeline, ...eonet.timeline];
  },
  async getImagery() {
    return [];
  },
  async getCharts() {
    const [earthquakes, weather] = await Promise.all([earthAdapter.getEarthquakes(), weatherAdapter.getGlobalConditions()]);
    return [...earthquakes.charts, ...weather.charts];
  }
};

export const satelliteProvider: LiveDataProvider = {
  id: "satellite",
  label: "Satellite Tracking",
  async getTelemetry() {
    const catalog = await satelliteAdapter.getCatalog();
    return catalog.metrics;
  },
  async getSatellites() {
    const catalog = await satelliteAdapter.getCatalog();
    return catalog.satellites;
  },
  async getAlerts() {
    return [];
  },
  async getWeather() {
    return [];
  },
  async getTimeline() {
    return [];
  },
  async getImagery() {
    return [];
  },
  async getCharts() {
    return [];
  }
};

export const solarWeatherProvider: LiveDataProvider = {
  id: "solar-weather",
  label: "Solar Weather",
  async getTelemetry() {
    const solar = await solarWeatherAdapter.getSolarWeather();
    return solar.metrics;
  },
  async getSatellites() {
    return [];
  },
  async getAlerts() {
    const solar = await solarWeatherAdapter.getSolarWeather();
    return solar.alerts;
  },
  async getWeather() {
    return [];
  },
  async getTimeline() {
    const solar = await solarWeatherAdapter.getSolarWeather();
    return solar.alerts.map((alert) => ({
      id: `timeline-${alert.id}`,
      source: alert.source,
      kind: "space-weather" as const,
      title: alert.title,
      detail: alert.detail,
      at: alert.at
    }));
  },
  async getImagery() {
    return [];
  },
  async getCharts() {
    const solar = await solarWeatherAdapter.getSolarWeather();
    return solar.charts;
  }
};

export async function getLiveDataSnapshot(): Promise<LiveDataSnapshot> {
  const providerSnapshots = await Promise.all([
    getNasaSnapshot(),
    ...[issProvider, spacexProvider, earthProvider, satelliteProvider, solarWeatherProvider].map((provider) => safeProvider(provider))
  ]);
  return providerSnapshots.reduce<LiveDataSnapshot>(
    (merged, snapshot) => ({
      providers: [...merged.providers, ...snapshot.providers],
      metrics: [...merged.metrics, ...snapshot.metrics],
      satellites: [...merged.satellites, ...snapshot.satellites],
      alerts: [...merged.alerts, ...snapshot.alerts],
      timeline: [...merged.timeline, ...snapshot.timeline].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
      weather: [...merged.weather, ...snapshot.weather],
      imagery: [...merged.imagery, ...snapshot.imagery],
      charts: [...merged.charts, ...snapshot.charts],
      updatedAt: new Date().toISOString()
    }),
    emptySnapshot()
  );
}
