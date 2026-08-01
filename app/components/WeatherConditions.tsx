"use client";

import { useCallback, useEffect, useState } from "react";
import type { Locale } from "../i18n/types";
import { observingConditionScore, parseOpenMeteoWeather, weatherApiUrl, type ObservingWeather } from "../simulation/weather";

const CACHE_PREFIX = "astro-shot-weather:";
const REFRESH_INTERVAL = 10 * 60 * 1000;

function dataAge(fetchedAt: number, locale: Locale) {
  const minutes = Math.max(0, Math.round((Date.now() - fetchedAt) / 60000));
  if (locale === "zh-TW") return minutes < 1 ? "剛剛" : `${minutes} 分鐘前`;
  return minutes < 1 ? "just now" : `${minutes} min ago`;
}

export function WeatherConditions({ latitude, longitude, locale }: { latitude: number; longitude: number; locale: Locale }) {
  const [weather, setWeather] = useState<ObservingWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<"live" | "cached" | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const zh = locale === "zh-TW";
  const cacheKey = `${CACHE_PREFIX}${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const load = useCallback(() => {
    setLoading(true);
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as ObservingWeather;
        Promise.resolve().then(() => {
          if (!active) return;
          setWeather(parsed);
          setSource("cached");
        });
      }
    } catch {}
    fetch(weatherApiUrl(latitude, longitude), { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Weather request failed"); return response.json(); })
      .then((payload) => {
        const next = parseOpenMeteoWeather(payload);
        if (!active) return;
        setWeather(next);
        setSource("live");
        try { window.localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
      })
      .catch((requestError: unknown) => {
        if (active && (requestError as { name?: string }).name !== "AbortError") setSource((current) => current === "live" ? "live" : "cached");
      })
      .finally(() => { if (active) setLoading(false); });
    const timer = window.setTimeout(load, REFRESH_INTERVAL);
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, [cacheKey, latitude, load, longitude, refreshKey]);

  if (!weather && loading) return <div className="weather-state" role="status">{zh ? "正在載入觀測天氣…" : "Loading observing weather…"}</div>;
  if (!weather) return <div className="weather-state error"><p>{zh ? "目前無法取得天氣資料；星空模擬不受影響。" : "Weather is unavailable; the sky simulation is unaffected."}</p><button type="button" onClick={load}>{zh ? "重試" : "Retry"}</button></div>;
  const score = observingConditionScore(weather);
  const stale = source === "cached";
  const label = score >= 75 ? (zh ? "良好" : "Good") : score >= 50 ? (zh ? "普通" : "Fair") : (zh ? "不佳" : "Poor");
  return <section className="weather-conditions">
    <header><div><span>{zh ? "觀測條件" : "Observing conditions"}</span><strong>{label}</strong></div><div className={`weather-score score-${score >= 75 ? "good" : score >= 50 ? "fair" : "poor"}`}><b>{score}</b><small>/100</small></div></header>
    {stale && <p className="weather-warning">{zh ? "目前顯示離線快取，並非即時天氣。" : "Showing offline cached data, not live weather."}</p>}
    <dl><div><dt>{zh ? "雲量" : "Cloud cover"}</dt><dd>{weather.cloudCoverPercent}%</dd></div><div><dt>{zh ? "降雨機率" : "Rain chance"}</dt><dd>{weather.precipitationProbabilityPercent}%</dd></div><div><dt>{zh ? "濕度" : "Humidity"}</dt><dd>{weather.humidityPercent}%</dd></div><div><dt>{zh ? "能見度" : "Visibility"}</dt><dd>{(weather.visibilityMeters / 1000).toFixed(1)} km</dd></div><div><dt>{zh ? "風速" : "Wind"}</dt><dd>{weather.windSpeedKmh.toFixed(1)} km/h</dd></div><div><dt>{zh ? "溫度" : "Temperature"}</dt><dd>{weather.temperatureCelsius.toFixed(1)}°C</dd></div></dl>
    <footer><span>{stale ? (zh ? "快取資料" : "Cached") : (zh ? "即時資料" : "Live")} · {dataAge(weather.fetchedAt, locale)}</span><button type="button" disabled={loading} onClick={load}>{loading ? "…" : (zh ? "更新" : "Refresh")}</button></footer>
    <small>{zh ? "預報模型資料，非現場觀測；評分僅供規劃參考。" : "Forecast-model data, not an on-site observation. Score is for planning only."} <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></small>
  </section>;
}
