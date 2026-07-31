"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import type { Locale } from "../i18n/types";
import { GALACTIC_CORE, planMilkyWay } from "../simulation/milky-way";

function direction(azimuth: number, locale: Locale) {
  const labels = locale === "zh-TW" ? ["北", "東北", "東", "東南", "南", "西南", "西", "西北"] : ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return labels[Math.round(azimuth / 45) % 8];
}

export function MilkyWayPlanner({ simulationTimeRef, latitude, longitude, locale }: { simulationTimeRef: RefObject<number>; latitude: number; longitude: number; locale: Locale }) {
  const [timestamp, setTimestamp] = useState(() => Date.now());
  useEffect(() => {
    const update = () => setTimestamp(simulationTimeRef.current || Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [simulationTimeRef]);
  const roundedTimestamp = Math.floor(timestamp / 60000) * 60000;
  const plan = useMemo(() => planMilkyWay(roundedTimestamp, latitude, longitude), [latitude, longitude, roundedTimestamp]);
  const zh = locale === "zh-TW";
  const time = (value: number | null) => value === null ? "—" : new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hour12: false }).format(value);
  const focusCore = () => window.dispatchEvent(new CustomEvent("sky:focus-object", { detail: { label: zh ? "銀河核心" : "Galactic Core", rightAscension: GALACTIC_CORE.rightAscension, declination: GALACTIC_CORE.declination } }));
  const recommendation = plan.best ? (plan.best.score > 25 ? (zh ? "條件良好：銀河核心夠高且月光干擾較低。" : "Good conditions: the core is high with limited moonlight.") : (zh ? "可以拍攝，但月光或低仰角會降低對比。" : "Possible, but moonlight or low altitude will reduce contrast.")) : (zh ? "未來 24 小時沒有同時符合天文夜與核心高度的時段。" : "No period in the next 24 hours meets both astronomical-night and core-altitude criteria.");
  return <section className="milky-way-planner">
    <header><div><h3>{zh ? "銀河核心" : "Galactic Core"}</h3><p>{direction(plan.coreNow.azimuthDegrees, locale)} · {zh ? "仰角" : "altitude"} {plan.coreNow.altitudeDegrees.toFixed(1)}°</p></div><button type="button" onClick={focusCore}>{zh ? "定位" : "Focus"}</button></header>
    <dl><div><dt>{zh ? "核心升起" : "Core rise"}</dt><dd>{time(plan.rise)}</dd></div><div><dt>{zh ? "核心落下" : "Core set"}</dt><dd>{time(plan.set)}</dd></div><div><dt>{zh ? "天文夜開始" : "Darkness starts"}</dt><dd>{time(plan.astronomicalNightStarts)}</dd></div><div><dt>{zh ? "天文夜結束" : "Darkness ends"}</dt><dd>{time(plan.astronomicalNightEnds)}</dd></div></dl>
    <div className="milky-way-window"><span>{zh ? "建議拍攝時段" : "Suggested window"}</span><strong>{plan.windowStart ? `${time(plan.windowStart)}–${time(plan.windowEnd)}` : "—"}</strong>{plan.best && <small>{zh ? `最佳仰角 ${plan.best.altitude.toFixed(0)}° · ${direction(plan.best.azimuth, locale)}` : `Best altitude ${plan.best.altitude.toFixed(0)}° · ${direction(plan.best.azimuth, locale)}`}</small>}</div>
    <p>{recommendation}</p>
    <small>{zh ? "以核心仰角、太陽低於 −18° 與近似月光干擾估算；不含天氣、光害與地形。" : "Estimated from core altitude, Sun below −18°, and approximate moonlight; weather, light pollution, and terrain are excluded."}</small>
  </section>;
}
