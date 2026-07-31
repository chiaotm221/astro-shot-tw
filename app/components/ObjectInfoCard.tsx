"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import type { Locale } from "../i18n/types";
import type { CelestialObject, CelestialObjectKind } from "../simulation/celestial-objects";
import { calculateVisibility } from "../simulation/visibility";
import { DEG } from "../simulation/astronomy-time";

const KIND: Record<Locale, Record<CelestialObjectKind, string>> = {
  "zh-TW": { star: "恆星", planet: "行星", constellation: "星座", "deep-sky": "深空天體" },
  en: { star: "Star", planet: "Planet", constellation: "Constellation", "deep-sky": "Deep-sky object" },
};

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

export function ObjectInfoCard({ object, latitude, siderealRef, locale, onClose }: { object: CelestialObject; latitude: number; siderealRef: RefObject<number>; locale: Locale; onClose: () => void }) {
  const [sidereal, setSidereal] = useState(0);
  useEffect(() => {
    const update = () => setSidereal(siderealRef.current ?? 0);
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [siderealRef]);
  const visibility = useMemo(() => calculateVisibility(object, latitude, sidereal), [latitude, object, sidereal]);
  const zh = locale === "zh-TW";
  const status = zh
    ? { visible: "目前可見", low: "接近地平線", later: "稍後升起", "not-tonight": "今晚不易觀測" }[visibility.status]
    : { visible: "Visible now", low: "Near the horizon", later: "Rises later", "not-tonight": "Not readily visible tonight" }[visibility.status];
  const focus = () => window.dispatchEvent(new CustomEvent("sky:focus-object", { detail: { object, id: object.id, label: object.name[locale], rightAscension: object.rightAscension, declination: object.declination } }));

  return <aside className="object-info-card" aria-label={zh ? "星體資訊" : "Object information"}>
    <header><div><span>{KIND[locale][object.kind]}</span><h2>{object.name[locale]}</h2><p>{object.name[zh ? "en" : "zh-TW"]}</p></div><button type="button" onClick={onClose} aria-label={zh ? "關閉星體資訊" : "Close object information"}>×</button></header>
    <dl>
      <div><dt>{zh ? "赤經" : "Right ascension"}</dt><dd>{rightAscension(object.rightAscension)}</dd></div>
      <div><dt>{zh ? "赤緯" : "Declination"}</dt><dd>{declination(object.declination)}</dd></div>
      <div><dt>{zh ? "方位角" : "Azimuth"}</dt><dd>{visibility.azimuthDegrees.toFixed(1)}°</dd></div>
      <div><dt>{zh ? "仰角" : "Altitude"}</dt><dd>{visibility.altitudeDegrees.toFixed(1)}°</dd></div>
      <div><dt>{zh ? "視星等" : "Magnitude"}</dt><dd>{object.magnitude?.toFixed(2) ?? "—"}</dd></div>
      <div><dt>{zh ? "距離" : "Distance"}</dt><dd>{object.distanceLightYears ? `${object.distanceLightYears.toLocaleString(locale)} ${zh ? "光年" : "ly"}` : "—"}</dd></div>
    </dl>
    {object.constellation && <p className="object-info-constellation">{zh ? "所在星座" : "Constellation"}: {object.constellation[locale]}</p>}
    <p className={`object-info-visibility ${visibility.status}`}>{status}{visibility.risesInHours !== null ? ` · ${zh ? "約" : "about"} ${visibility.risesInHours.toFixed(1)} ${zh ? "小時" : "hours"}` : ""}</p>
    {object.description && <p className="object-info-description">{object.description[locale]}</p>}
    <button className="object-info-focus" type="button" onClick={focus}>{zh ? "移動視角至目標" : "Move view to target"}</button>
    <small>{zh ? "方位、仰角與升起時間為近似計算。" : "Direction, altitude, and rise time are approximate."}</small>
  </aside>;
}
