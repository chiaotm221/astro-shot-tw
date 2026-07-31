export type ObservingWeather = {
  observedAt: string;
  fetchedAt: number;
  temperatureCelsius: number;
  humidityPercent: number;
  cloudCoverPercent: number;
  precipitationMillimeters: number;
  precipitationProbabilityPercent: number;
  visibilityMeters: number;
  windSpeedKmh: number;
};

type OpenMeteoResponse = {
  current?: { time?: string; temperature_2m?: number; relative_humidity_2m?: number; precipitation?: number; cloud_cover?: number; wind_speed_10m?: number };
  hourly?: { time?: string[]; precipitation_probability?: number[]; visibility?: number[] };
};

export function weatherApiUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    latitude: latitude.toFixed(5),
    longitude: longitude.toFixed(5),
    current: "temperature_2m,relative_humidity_2m,precipitation,cloud_cover,wind_speed_10m",
    hourly: "precipitation_probability,visibility",
    forecast_days: "1",
    timezone: "auto",
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

export function parseOpenMeteoWeather(payload: OpenMeteoResponse, fetchedAt = Date.now()): ObservingWeather {
  const current = payload.current;
  if (!current?.time || !Number.isFinite(current.temperature_2m) || !Number.isFinite(current.relative_humidity_2m) || !Number.isFinite(current.cloud_cover) || !Number.isFinite(current.wind_speed_10m)) throw new Error("Incomplete weather response");
  const times = payload.hourly?.time ?? [];
  let index = times.findIndex((time) => time >= current.time!);
  if (index < 0) index = 0;
  const precipitationProbability = payload.hourly?.precipitation_probability?.[index];
  const visibility = payload.hourly?.visibility?.[index];
  return {
    observedAt: current.time,
    fetchedAt,
    temperatureCelsius: current.temperature_2m!,
    humidityPercent: current.relative_humidity_2m!,
    cloudCoverPercent: current.cloud_cover!,
    precipitationMillimeters: current.precipitation ?? 0,
    precipitationProbabilityPercent: Number.isFinite(precipitationProbability) ? precipitationProbability! : 0,
    visibilityMeters: Number.isFinite(visibility) ? visibility! : 10000,
    windSpeedKmh: current.wind_speed_10m!,
  };
}

export function observingConditionScore(weather: ObservingWeather) {
  const cloud = Math.max(0, 1 - weather.cloudCoverPercent / 100);
  const rain = Math.max(0, 1 - Math.max(weather.precipitationProbabilityPercent / 100, weather.precipitationMillimeters / 2));
  const visibility = Math.min(1, Math.max(0, weather.visibilityMeters / 20000));
  const wind = Math.max(0, 1 - Math.max(0, weather.windSpeedKmh - 8) / 32);
  const humidity = Math.max(0, 1 - Math.max(0, weather.humidityPercent - 65) / 35);
  return Math.round(100 * (cloud * 0.45 + rain * 0.25 + visibility * 0.15 + wind * 0.1 + humidity * 0.05));
}
