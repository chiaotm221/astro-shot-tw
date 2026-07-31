"use client";

import { useCallback, useEffect, useState } from "react";
import type { Locale } from "../i18n/types";
import { observingConditionScore, parseOpenMeteoWeather, weatherApiUrl, type ObservingWeather } from "../simulation/weather";

const CACHE_PREFIX = "astro-shot-weather:";

export function WeatherConditions({ latitude, longitude, locale }: { latitude: number; longitude: number; locale: Locale }) {
  const [weather, setWeather] = useState<ObservingWeather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const zh = locale === "zh-TW";
  const cacheKey = `${CACHE_PREFIX}${latitude.toFixed(2)},${longitude.toFixed(2)}`;
  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    setRefreshKey((value) => value + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    try {
      const cached = window.localStorage.getItem(cacheKey);
      if (cached) Promise.resolve().then(() => { if (active) setWeather(JSON.parse(cached) as ObservingWeather); });
    } catch {}
    fetch(weatherApiUrl(latitude, longitude), { signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error("Weather request failed"); return response.json(); })
      .then((payload) => {
        const next = parseOpenMeteoWeather(payload);
        if (!active) return;
        setWeather(next);
        try { window.localStorage.setItem(cacheKey, JSON.stringify(next)); } catch {}
        setError(false);
      })
      .catch((requestError: unknown) => { if (active && (requestError as { name?: string }).name !== "AbortError") setError(true); })
      .finally(() => { if (active) setLoading(false); });
    const timer = window.setTimeout(load, 10 * 60 * 1000);
    return () => { active = false; controller.abort(); window.clearTimeout(timer); };
  }, [cacheKey, latitude, load, longitude, refreshKey]);

  if (!weather && loading) return <div className="weather-state" role="status">{zh ? "正在載入觀測天氣…" : "Loading observing weather…"}</div>;
  if (!weather) return <div className="weather-state error"><p>{zh ? "目前無法取得天氣資料，星空模擬不受影響。" : "Weather is unavailable; the sky simulation is unaffected."}</p><button type="button" onClick={load}>{zh ? "重試" : "Retry"}</button></div>;
  const score = observingConditionScore(weather);
  const stale = error;
  const label = score >= 75 ? (zh ? "良好" : "Good") : score >= 50 ? (zh ? "普通" : "Fair") : (zh ? "不佳" : "Poor");
  return <section className="weather-conditions">
    <header><div><span>{zh ? "觀星條件" : "Observing conditions"}</span><strong>{label}</strong></div><div className={`weather-score score-${score >= 75 ? "good" : score >= 50 ? "fair" : "poor"}`}><b>{score}</b><small>/100</small></div></header>
    {error && <p className="weather-warning">{zh ? "更新失敗，顯示上次快取資料。" : "Refresh failed; showing cached data."}</p>}
    <dl><div><dt>{zh ? "雲量" : "Cloud cover"}</dt><dd>{weather.cloudCoverPercent}%</dd></div><div><dt>{zh ? "降雨機率" : "Rain chance"}</dt><dd>{weather.precipitationProbabilityPercent}%</dd></div><div><dt>{zh ? "濕度" : "Humidity"}</dt><dd>{weather.humidityPercent}%</dd></div><div><dt>{zh ? "能見度" : "Visibility"}</dt><dd>{(weather.visibilityMeters / 1000).toFixed(1)} km</dd></div><div><dt>{zh ? "風速" : "Wind"}</dt><dd>{weather.windSpeedKmh.toFixed(1)} km/h</dd></div><div><dt>{zh ? "氣溫" : "Temperature"}</dt><dd>{weather.temperatureCelsius.toFixed(1)}°C</dd></div></dl>
    <footer><span>{stale ? (zh ? "快取資料" : "Cached") : (zh ? "已更新" : "Updated")} · {new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(weather.fetchedAt)}</span><button type="button" disabled={loading} onClick={load}>{loading ? "…" : (zh ? "更新" : "Refresh")}</button></footer>
    <small>{zh ? "預報模型資料，不等同現場觀測。分數僅供規劃參考。" : "Forecast-model data, not an on-site observation. Score is for planning only."} <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></small>
  </section>;
}
