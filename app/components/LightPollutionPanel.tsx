"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import type { Locale } from "../i18n/types";
import type { ObservingSite } from "../simulation/observing-sites";
import { moonHorizontalCoordinates } from "../simulation/moon";
import { combinedDarknessScore, formatRange, LIGHT_POLLUTION_PROFILES } from "../simulation/light-pollution";

export function LightPollutionPanel({ sites, selectedSite, onChange, simulationTimeRef, locale }: { sites: readonly ObservingSite[]; selectedSite: ObservingSite; onChange: (id: string) => void; simulationTimeRef: RefObject<number>; locale: Locale }) {
  const [timestamp, setTimestamp] = useState(() => Date.now());
  useEffect(() => {
    const update = () => setTimestamp(simulationTimeRef.current || Date.now());
    update();
    const timer = window.setInterval(update, 2000);
    return () => window.clearInterval(timer);
  }, [simulationTimeRef]);
  const zh = locale === "zh-TW";
  const profile = LIGHT_POLLUTION_PROFILES[selectedSite.id];
  const moon = useMemo(() => moonHorizontalCoordinates(timestamp, selectedSite.latitude, selectedSite.longitude), [selectedSite.latitude, selectedSite.longitude, timestamp]);
  const comparableSites = sites.filter((site) => LIGHT_POLLUTION_PROFILES[site.id]);
  if (!profile) return <section className="light-pollution-panel"><p>{zh ? "自訂地點沒有內建光害估算；請以現場 SQM 測量或具日期的光害圖資為準。" : "Custom locations have no bundled light-pollution estimate; use an on-site SQM reading or dated map data."}</p></section>;
  const score = combinedDarknessScore(profile, moon.moon.illuminatedFraction, moon.altitudeDegrees);
  const moonAbove = moon.altitudeDegrees > 0;
  return <section className="light-pollution-panel">
    <header><div><span>{zh ? "綜合暗空分數" : "Combined darkness"}</span><strong>{score}<small>/100</small></strong></div><div><span>Bortle</span><b>{profile.bortleRange}</b></div></header>
    <dl><div><dt>{zh ? "推估天空亮度" : "Estimated sky brightness"}</dt><dd>{formatRange(profile.skyBrightnessRange, 1)} mag/arcsec²</dd></div><div><dt>{zh ? "肉眼極限星等" : "Naked-eye limit"}</dt><dd>{formatRange(profile.limitingMagnitudeRange, 1)} mag</dd></div><div><dt>{zh ? "肉眼可見星數" : "Visible-star estimate"}</dt><dd>{formatRange(profile.estimatedVisibleStars)} {zh ? "顆" : "stars"}</dd></div><div><dt>{zh ? "都市天光方向" : "Urban light domes"}</dt><dd>{profile.lightDomes[locale]}</dd></div></dl>
    <p className="light-pollution-moon"><strong>{zh ? "月光修正" : "Moonlight adjustment"}</strong>{moonAbove ? (zh ? `月球在地平線上，照明 ${Math.round(moon.moon.illuminatedFraction * 100)}%，已降低暗空分數。` : `Moon above horizon at ${Math.round(moon.moon.illuminatedFraction * 100)}% illumination; darkness score reduced.`) : (zh ? "月球目前在地平線下，未扣除月光分數。" : "Moon is below the horizon; no moonlight penalty applied.")}</p>
    <div className="light-pollution-compare"><span>{zh ? "地點比較" : "Compare sites"}</span>{comparableSites.map((site) => { const item = LIGHT_POLLUTION_PROFILES[site.id]; const itemScore = combinedDarknessScore(item, moon.moon.illuminatedFraction, moonHorizontalCoordinates(timestamp, site.latitude, site.longitude).altitudeDegrees); return <button key={site.id} type="button" className={site.id === selectedSite.id ? "active" : ""} onClick={() => onChange(site.id)}><span>{site.name[locale]}</span><small>B {item.bortleRange}</small><b>{itemScore}</b></button>; })}</div>
    <small>{zh ? "2016 世界人工夜空亮度圖集概念的場地級歷史估算，未直接取樣原始像素；Bortle、SQM 與星數為範圍，不是即時測量。" : "Site-level historical estimates informed by the 2016 World Atlas concept, without direct raster sampling; Bortle, SQM, and star counts are ranges, not live measurements."}</small>
  </section>;
}
