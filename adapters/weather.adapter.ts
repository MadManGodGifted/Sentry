import dayjs from "dayjs";
import { http } from "@/api/http";
import type { LiveChartSeries, LiveWeather } from "@/types/live-data";

type OpenMeteoResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    wind_speed_10m?: number;
    pressure_msl?: number;
    cloud_cover?: number;
  };
  hourly?: {
    time?: string[];
    wind_speed_10m?: number[];
  };
};

export const weatherAdapter = {
  async getGlobalConditions(): Promise<{ weather: LiveWeather[]; charts: LiveChartSeries[] }> {
    const baseUrl = process.env.NEXT_PUBLIC_OPEN_METEO_API_BASE ?? "https://api.open-meteo.com";
    const sites = [
      { id: "houston", location: "Houston Mission Control", latitude: 29.55, longitude: -95.09 },
      { id: "kennedy", location: "Kennedy Space Center", latitude: 28.57, longitude: -80.65 },
      { id: "tokyo", location: "Tokyo Ground Reference", latitude: 35.68, longitude: 139.76 }
    ];
    const responses = await Promise.all(
      sites.map((site) =>
        http.get<OpenMeteoResponse>(`${baseUrl}/v1/forecast`, {
          params: {
            latitude: site.latitude,
            longitude: site.longitude,
            current: "temperature_2m,wind_speed_10m,pressure_msl,cloud_cover",
            hourly: "wind_speed_10m",
            timezone: "UTC"
          }
        })
      )
    );

    return {
      weather: responses.map((response, index) => ({
        id: `wx-${sites[index].id}`,
        location: sites[index].location,
        temperatureC: response.data.current?.temperature_2m,
        windKph: response.data.current?.wind_speed_10m,
        pressureHpa: response.data.current?.pressure_msl,
        cloudCover: response.data.current?.cloud_cover,
        at: dayjs(response.data.current?.time).toISOString()
      })),
      charts: responses.slice(0, 1).map((response) => ({
        id: "weather-wind",
        label: "OPEN-METEO WIND",
        points: (response.data.hourly?.time ?? []).slice(0, 12).map((time, index) => ({
          x: dayjs(time).format("HH:mm"),
          y: response.data.hourly?.wind_speed_10m?.[index] ?? 0
        }))
      }))
    };
  }
};
