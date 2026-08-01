"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import type { Locale } from "../i18n/types";
import type { CelestialObject, CelestialObjectKind } from "../simulation/celestial-objects";
import { calculateVisibility } from "../simulation/visibility";
import { DEG } from "../simulation/astronomy-time";
import { isEphemerisTimestampSupported, solarSystemEvents, solarSystemPosition, type SolarSystemBodyId } from "../simulation/solar-system-ephemeris";
import { startOfLocalDay } from "../simulation/time-events";

const KIND: Record<Locale, Record<CelestialObjectKind, string>> = {
  "zh-TW": { star: "恆星", planet: "太陽系天體", constellation: "星座", "deep-sky": "深空天體" },
  en: { star: "Star", planet: "Solar System object", constellation: "Constellation", "deep-sky": "Deep-sky object" },
};
const SOLAR_IDS = new Set<SolarSystemBodyId>(["moon", "mercury", "venus", "mars", "jupiter", "saturn"]);

function rightAscension(value: number) {
  const hours = ((value / DEG / 15) % 24 + 24) % 24;
  const wholeHours = Math.floor(hours);
  const minutes = Math.floor((hours - wholeHours) * 60);
  return `${wholeHours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`;
}

function declination(value: number) {
  const degrees = value / DEG;
  return `${degrees >= 0 ? "+" : "−"}${Math.abs(degrees).toFixed(1)}°`;
}

export function ObjectInfoCard({ object, latitude, longitude, elevationMeters, siderealRef, simulationTimeRef, locale, onClose }: { object: CelestialObject; latitude: number; longitude: number; elevationMeters: number; siderealRef: RefObject<number>; simulationTimeRef: RefObject<number>; locale: Locale; onClose: () => void }) {
  const [sidereal, setSidereal] = useState(0);
  const [timestamp, setTimestamp] = useState(0);
  useEffect(() => {
    const update = () => { setSidereal(siderealRef.current ?? 0); setTimestamp(simulationTimeRef.current); };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [siderealRef, simulationTimeRef]);

  const solarBody = SOLAR_IDS.has(object.id as SolarSystemBodyId) ? object.id as SolarSystemBodyId : null;
  const dynamicPosition = useMemo(() => solarBody && isEphemerisTimestampSupported(timestamp) ? solarSystemPosition(solarBody, timestamp, { latitude, longitude, elevationMeters }) : null, [elevationMeters, latitude, longitude, solarBody, timestamp]);
  const resolvedObject = useMemo(() => dynamicPosition ? { ...object, rightAscension: dynamicPosition.apparentEquatorialOfDate.rightAscensionRadians, declination: dynamicPosition.apparentEquatorialOfDate.declinationRadians, magnitude: dynamicPosition.visualMagnitude } : object, [dynamicPosition, object]);
  const dayStart = timestamp ? startOfLocalDay(timestamp) : 0;
  const events = useMemo(() => solarBody && isEphemerisTimestampSupported(dayStart) ? solarSystemEvents(solarBody, dayStart, dayStart + 86400000, { latitude, longitude, elevationMeters }) : null, [dayStart, elevationMeters, latitude, longitude, solarBody]);
  const visibility = useMemo(() => calculateVisibility(resolvedObject, latitude, sidereal), [latitude, resolvedObject, sidereal]);
  const zh = locale === "zh-TW";
  const status = zh
    ? { visible: "現在可見", low: "接近地平線", later: "稍後升起", "not-tonight": "今晚不易觀測" }[visibility.status]
    : { visible: "Visible now", low: "Near the horizon", later: "Rises later", "not-tonight": "Not readily visible tonight" }[visibility.status];
  const focus = () => window.dispatchEvent(new CustomEvent("sky:focus-object", { detail: { object: resolvedObject, id: resolvedObject.id, label: resolvedObject.name[locale], rightAscension: resolvedObject.rightAscension, declination: resolvedObject.declination } }));
  const eventTime = (value: number | null) => value === null ? "—" : new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(value);

  return <aside className="object-info-card" aria-label={zh ? "天體資訊" : "Object information"}>
    <header><div><span>{KIND[locale][object.kind]}</span><h2>{object.name[locale]}</h2><p>{object.name[zh ? "en" : "zh-TW"]}</p></div><button type="button" onClick={onClose} aria-label={zh ? "關閉天體資訊" : "Close object information"}>×</button></header>
    <dl>
      <div><dt>{zh ? "赤經" : "Right ascension"}</dt><dd>{rightAscension(resolvedObject.rightAscension)}</dd></div>
      <div><dt>{zh ? "赤緯" : "Declination"}</dt><dd>{declination(resolvedObject.declination)}</dd></div>
      <div><dt>{zh ? "方位角" : "Azimuth"}</dt><dd>{visibility.azimuthDegrees.toFixed(1)}°</dd></div>
      <div><dt>{zh ? "仰角" : "Altitude"}</dt><dd>{visibility.altitudeDegrees.toFixed(1)}°</dd></div>
      <div><dt>{zh ? "視星等" : "Magnitude"}</dt><dd>{resolvedObject.magnitude?.toFixed(2) ?? "—"}</dd></div>
      <div><dt>{zh ? "距離" : "Distance"}</dt><dd>{object.distanceLightYears ? `${object.distanceLightYears.toLocaleString(locale)} ${zh ? "光年" : "ly"}` : dynamicPosition ? `${dynamicPosition.apparentEquatorialOfDate.distanceAu.toFixed(4)} AU` : "—"}</dd></div>
    </dl>
    {events && <dl><div><dt>{zh ? "升起" : "Rise"}</dt><dd>{eventTime(events.rise)}</dd></div><div><dt>{zh ? "過中天" : "Transit"}</dt><dd>{eventTime(events.transit)}</dd></div><div><dt>{zh ? "落下" : "Set"}</dt><dd>{eventTime(events.set)}</dd></div></dl>}
    {object.constellation && <p className="object-info-constellation">{zh ? "所在星座" : "Constellation"}: {object.constellation[locale]}</p>}
    <p className={`object-info-visibility ${visibility.status}`}>{status}{visibility.risesInHours !== null ? ` · ${zh ? "約" : "about"} ${visibility.risesInHours.toFixed(1)} ${zh ? "小時" : "hours"}` : ""}</p>
    {object.description && <p className="object-info-description">{object.description[locale]}</p>}
    <button className="object-info-focus" type="button" onClick={focus}>{zh ? "將視角移至目標" : "Move view to target"}</button>
    <small>{solarBody ? (zh ? "V7.0 離線星曆；2020–2040 已驗證範圍。升落時間不含地形影響。" : "V7.0 offline ephemeris; validated for 2020–2040. Event times exclude terrain.") : (zh ? "方向、仰角與升起時間為近似值。" : "Direction, altitude, and rise time are approximate.")}</small>
  </aside>;
}
