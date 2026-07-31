"use client";

import { useEffect, useMemo, useState, type CSSProperties, type RefObject } from "react";
import type { Locale } from "../i18n/types";
import { calculateMoonPosition, findMoonRiseAndSet, moonHorizontalCoordinates, moonPhaseKey } from "../simulation/moon";

const PHASES = {
  "zh-TW": { new: "新月", "waxing-crescent": "眉月", "first-quarter": "上弦月", "waxing-gibbous": "盈凸月", full: "滿月", "waning-gibbous": "虧凸月", "last-quarter": "下弦月", "waning-crescent": "殘月" },
  en: { new: "New Moon", "waxing-crescent": "Waxing Crescent", "first-quarter": "First Quarter", "waxing-gibbous": "Waxing Gibbous", full: "Full Moon", "waning-gibbous": "Waning Gibbous", "last-quarter": "Last Quarter", "waning-crescent": "Waning Crescent" },
} as const;

export function MoonConditions({ simulationTimeRef, latitude, longitude, locale }: { simulationTimeRef: RefObject<number>; latitude: number; longitude: number; locale: Locale }) {
  const [timestamp, setTimestamp] = useState(() => Date.now());
  useEffect(() => {
    const update = () => setTimestamp(simulationTimeRef.current || Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [simulationTimeRef]);
  const data = useMemo(() => {
    const horizontal = moonHorizontalCoordinates(timestamp, latitude, longitude);
    return { ...horizontal, events: findMoonRiseAndSet(timestamp, latitude, longitude) };
  }, [latitude, longitude, timestamp]);
  const zh = locale === "zh-TW";
  const formatTime = (value: number | null) => value === null ? "—" : new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(value);
  const impact = data.moon.illuminatedFraction > 0.72 && data.altitudeDegrees > -6 ? (zh ? "高：銀河與暗淡深空天體較難觀測" : "High: the Milky Way and faint objects are harder to see") : data.moon.illuminatedFraction > 0.35 && data.altitudeDegrees > 0 ? (zh ? "中等：月光會降低天空對比" : "Moderate: moonlight reduces sky contrast") : (zh ? "低：月光干擾較少" : "Low: limited moonlight interference");
  const phase = PHASES[locale][moonPhaseKey(data.moon.ageDays)];
  const upcoming = [1, 2, 3, 4].map((days) => { const moon = calculateMoonPosition(timestamp + days * 86400000); return { days, moon, phase: PHASES[locale][moonPhaseKey(moon.ageDays)] }; });
  return <section className="moon-conditions">
    <header><div className={`moon-phase-icon${data.moon.waxing ? " waxing" : " waning"}`} style={{ "--moon-light": `${Math.round(data.moon.illuminatedFraction * 100)}%` } as CSSProperties} aria-hidden="true" /><div><h3>{phase}</h3><p>{zh ? `照明 ${Math.round(data.moon.illuminatedFraction * 100)}% · 月齡 ${data.moon.ageDays.toFixed(1)} 日` : `${Math.round(data.moon.illuminatedFraction * 100)}% illuminated · age ${data.moon.ageDays.toFixed(1)} days`}</p></div></header>
    <dl><div><dt>{zh ? "方位角" : "Azimuth"}</dt><dd>{data.azimuthDegrees.toFixed(1)}°</dd></div><div><dt>{zh ? "仰角" : "Altitude"}</dt><dd>{data.altitudeDegrees.toFixed(1)}°</dd></div><div><dt>{zh ? "下次月出" : "Next moonrise"}</dt><dd>{formatTime(data.events.rise)}</dd></div><div><dt>{zh ? "下次月落" : "Next moonset"}</dt><dd>{formatTime(data.events.set)}</dd></div></dl>
    <p className="moon-impact"><strong>{zh ? "月光影響" : "Moonlight impact"}</strong>{impact}</p>
    <div className="moon-outlook">{upcoming.map(({ days, moon, phase: futurePhase }) => <div key={days}><span>+{days}{zh ? "日" : "d"}</span><strong>{futurePhase}</strong><small>{Math.round(moon.illuminatedFraction * 100)}%</small></div>)}</div>
    <small className="moon-note">{zh ? "月球位置、月出月落與月光影響為低精度近似值，不含地形與大氣折射。" : "Moon position, rise/set, and impact are low-precision approximations without terrain or refraction."}</small>
  </section>;
}
