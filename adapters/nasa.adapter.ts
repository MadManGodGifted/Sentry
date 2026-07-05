import dayjs from "dayjs";
import { http } from "@/api/http";
import type { LiveAlert, LiveImagery, LiveMetric, LiveTimelineEvent } from "@/types/live-data";

const NASA_BASE = process.env.NEXT_PUBLIC_NASA_API_BASE ?? "https://api.nasa.gov";
const EONET_BASE = process.env.NEXT_PUBLIC_NASA_EONET_API_BASE ?? "https://eonet.gsfc.nasa.gov/api/v3";
const TECHPORT_BASE = process.env.NEXT_PUBLIC_NASA_TECHPORT_API_BASE ?? "https://techport.nasa.gov/api";

function nasaKey() {
  return process.env.NEXT_PUBLIC_NASA_API_KEY;
}

function requireNasaKey() {
  const key = nasaKey();
  if (!key) {
    throw new Error("NEXT_PUBLIC_NASA_API_KEY is required for NASA Open APIs.");
  }
  return key;
}

type NeoResponse = {
  element_count?: number;
  near_earth_objects?: Record<string, Array<{ id: string; name: string; close_approach_data?: Array<{ close_approach_date_full?: string; miss_distance?: { kilometers?: string } }> }>>;
};

type DonkiEvent = {
  flrID?: string;
  gstID?: string;
  startTime?: string;
  kpIndex?: number;
  classType?: string;
  sourceLocation?: string;
  instruments?: Array<{ displayName?: string }>;
};

type EonetResponse = {
  events?: Array<{
    id: string;
    title: string;
    categories?: Array<{ id: string; title: string }>;
    geometry?: Array<{ date?: string; coordinates?: unknown }>;
  }>;
};

export const nasaAdapter = {
  async getApod(): Promise<LiveImagery[]> {
    const { data } = await http.get<{ title?: string; url?: string; date?: string; media_type?: string }>(`${NASA_BASE}/planetary/apod`, {
      params: { api_key: requireNasaKey() }
    });
    return [
      {
        id: "nasa-apod",
        source: "NASA APOD",
        title: data.title ?? "Astronomy Picture of the Day",
        url: data.media_type === "image" ? data.url : undefined,
        at: data.date ? dayjs(data.date).toISOString() : new Date().toISOString()
      }
    ];
  },

  async getEpicImagery(): Promise<LiveImagery[]> {
    const { data } = await http.get<Array<{ identifier?: string; image?: string; caption?: string; date?: string }>>(`${NASA_BASE}/EPIC/api/natural`, {
      params: { api_key: requireNasaKey() }
    });
    return data.slice(0, 3).map((image) => {
      const datePath = dayjs(image.date).format("YYYY/MM/DD");
      return {
        id: `nasa-epic-${image.identifier ?? image.image}`,
        source: "NASA EPIC",
        title: image.caption ?? "EPIC Earth image",
        url: image.image ? `https://epic.gsfc.nasa.gov/archive/natural/${datePath}/png/${image.image}.png` : undefined,
        at: dayjs(image.date).toISOString()
      };
    });
  },

  async getMarsRoverPhotos(): Promise<LiveImagery[]> {
    const { data } = await http.get<{
      photos?: Array<{ id: number; img_src?: string; earth_date?: string; rover?: { name?: string }; camera?: { full_name?: string } }>;
    }>(`${NASA_BASE}/mars-photos/api/v1/rovers/curiosity/photos`, {
      params: { sol: 1000, page: 1, api_key: requireNasaKey() }
    });
    return (data.photos ?? []).slice(0, 4).map((photo) => ({
      id: `mars-${photo.id}`,
      source: "NASA Mars Rover Photos",
      title: `${photo.rover?.name ?? "Curiosity"} / ${photo.camera?.full_name ?? "Rover camera"}`,
      url: photo.img_src,
      at: dayjs(photo.earth_date).toISOString()
    }));
  },

  async getEarthAssets(): Promise<LiveImagery[]> {
    const { data } = await http.get<{ results?: Array<{ date?: string; id?: string; resource?: { dataset?: string; planet?: string } }>; count?: number }>(
      `${NASA_BASE}/planetary/earth/assets`,
      {
        params: { lon: -80.65, lat: 28.57, date: "2024-01-01", dim: 0.12, api_key: requireNasaKey() }
      }
    );
    const results = data.results ?? [];
    return [
      ...(results.length
        ? results.slice(0, 4).map((asset, index) => ({
            id: `nasa-earth-assets-${asset.id ?? index}`,
            source: "NASA Earth Assets",
            title: `${asset.resource?.dataset ?? "Earth asset"} / ${asset.resource?.planet ?? "earth"}`,
            at: dayjs(asset.date).toISOString()
          }))
        : [
            {
              id: "nasa-earth-assets-empty",
              source: "NASA Earth Assets",
              title: `Earth asset index returned ${data.count ?? 0} records`,
              at: new Date().toISOString()
            }
          ])
    ];
  },

  async getNearEarthObjects(): Promise<{ metrics: LiveMetric[]; alerts: LiveAlert[]; timeline: LiveTimelineEvent[] }> {
    const { data } = await http.get<NeoResponse>(`${NASA_BASE}/neo/rest/v1/feed`, {
      params: { api_key: requireNasaKey() }
    });
    const objects = Object.values(data.near_earth_objects ?? {}).flat();
    return {
      metrics: [
        {
          id: "nasa-neo-count",
          label: "NEO CLOSE APPROACHES",
          value: data.element_count ?? objects.length,
          source: "NASA NeoWs",
          at: new Date().toISOString()
        }
      ],
      alerts: objects.slice(0, 4).map((object) => ({
        id: `neo-${object.id}`,
        source: "NASA NeoWs",
        severity: "info",
        title: object.name,
        detail: `MISS ${Math.round(Number(object.close_approach_data?.[0]?.miss_distance?.kilometers ?? 0)).toLocaleString()} KM`,
        at: dayjs(object.close_approach_data?.[0]?.close_approach_date_full).toISOString()
      })),
      timeline: objects.slice(0, 6).map((object) => ({
        id: `neo-event-${object.id}`,
        source: "NASA NeoWs",
        kind: "mission",
        title: object.name,
        detail: "Near Earth object close approach",
        at: dayjs(object.close_approach_data?.[0]?.close_approach_date_full).toISOString()
      }))
    };
  },

  async getDonki(): Promise<{ metrics: LiveMetric[]; alerts: LiveAlert[]; timeline: LiveTimelineEvent[] }> {
    const apiKey = requireNasaKey();
    const startDate = dayjs().subtract(30, "day").format("YYYY-MM-DD");
    const endDate = dayjs().format("YYYY-MM-DD");
    const [flares, storms] = await Promise.all([
      http.get<DonkiEvent[]>(`${NASA_BASE}/DONKI/FLR`, { params: { startDate, endDate, api_key: apiKey } }),
      http.get<DonkiEvent[]>(`${NASA_BASE}/DONKI/GST`, { params: { startDate, endDate, api_key: apiKey } })
    ]);
    const flareEvents = flares.data.slice(-8);
    const stormEvents = storms.data.slice(-8);
    return {
      metrics: [
        { id: "donki-flares", label: "SOLAR FLARES", value: flareEvents.length, source: "NASA DONKI", at: new Date().toISOString() },
        { id: "donki-storms", label: "GEOMAG STORMS", value: stormEvents.length, source: "NASA DONKI", at: new Date().toISOString() }
      ],
      alerts: [
        ...flareEvents.slice(-3).map((flare) => ({
          id: flare.flrID ?? `flare-${flare.startTime}`,
          source: "NASA DONKI",
          severity: (flare.classType?.startsWith("X") ? "critical" : flare.classType?.startsWith("M") ? "warning" : "info") as LiveAlert["severity"],
          title: `${flare.classType ?? "SOLAR"} FLARE`,
          detail: flare.sourceLocation ?? flare.instruments?.[0]?.displayName ?? "Solar flare event",
          at: dayjs(flare.startTime).toISOString()
        })),
        ...stormEvents.slice(-3).map((storm) => ({
          id: storm.gstID ?? `storm-${storm.startTime}`,
          source: "NASA DONKI",
          severity: ((storm.kpIndex ?? 0) >= 6 ? "warning" : "info") as LiveAlert["severity"],
          title: `GEOMAGNETIC STORM KP ${storm.kpIndex ?? "--"}`,
          detail: "DONKI geomagnetic storm event",
          at: dayjs(storm.startTime).toISOString()
        }))
      ],
      timeline: [...flareEvents, ...stormEvents].slice(-8).map((event) => ({
        id: event.flrID ?? event.gstID ?? `donki-${event.startTime}`,
        source: "NASA DONKI",
        kind: "space-weather",
        title: event.classType ? `${event.classType} SOLAR FLARE` : `GEOMAG STORM KP ${event.kpIndex ?? "--"}`,
        detail: event.sourceLocation ?? "Space weather event",
        at: dayjs(event.startTime).toISOString()
      }))
    };
  },

  async getEonet(): Promise<{ alerts: LiveAlert[]; timeline: LiveTimelineEvent[] }> {
    const { data } = await http.get<EonetResponse>(`${EONET_BASE}/events`, {
      params: { status: "open", limit: 20, days: 30, category: "wildfires,severeStorms,volcanoes" }
    });
    const events = data.events ?? [];
    return {
      alerts: events.slice(0, 8).map((event) => ({
        id: `eonet-${event.id}`,
        source: "NASA EONET",
        severity: event.categories?.some((category) => category.id === "severeStorms") ? "warning" : "info",
        title: event.title,
        detail: event.categories?.map((category) => category.title).join(" / ") ?? "Natural event",
        at: dayjs(event.geometry?.[0]?.date).toISOString()
      })),
      timeline: events.map((event) => ({
        id: `eonet-event-${event.id}`,
        source: "NASA EONET",
        kind: "natural-event",
        title: event.title,
        detail: event.categories?.map((category) => category.title).join(" / ") ?? "Natural event",
        at: dayjs(event.geometry?.[0]?.date).toISOString()
      }))
    };
  },

  async getTechPort(): Promise<LiveMetric[]> {
    const { data } = await http.get<{ projects?: unknown[] }>(`${TECHPORT_BASE}/projects`);
    return [
      {
        id: "techport-projects",
        label: "TECHPORT PROJECTS",
        value: data.projects?.length ?? 0,
        source: "NASA TechPort",
        at: new Date().toISOString()
      }
    ];
  }
};
