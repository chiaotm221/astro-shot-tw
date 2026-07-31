"use client";

import { useState } from "react";
import type { Locale } from "../i18n/types";
import type { ObservingSite } from "../simulation/observing-sites";
import { OBSERVING_SITE_DETAILS, type SiteCategory } from "../simulation/observing-site-details";

const project = (site: ObservingSite) => ({ x: ((site.longitude - 119.8) / 2.2) * 180, y: ((25.4 - site.latitude) / 3.6) * 360 });

export function TaiwanObservingMap({ sites, selectedSite, onChange, locale }: { sites: readonly ObservingSite[]; selectedSite: ObservingSite; onChange: (id: string) => void; locale: Locale }) {
  const [category, setCategory] = useState<SiteCategory | "all">("all");
  const zh = locale === "zh-TW";
  const details = OBSERVING_SITE_DETAILS[selectedSite.id];
  const categories: readonly (SiteCategory | "all")[] = ["all", "urban", "highland", "coast"];
  const categoryName = (value: SiteCategory | "all") => zh ? ({ all: "全部", urban: "都市", highland: "高山", coast: "海邊" }[value]) : ({ all: "All", urban: "Urban", highland: "Highland", coast: "Coast" }[value]);
  const visibleSites = sites.filter((site) => OBSERVING_SITE_DETAILS[site.id] && (category === "all" || OBSERVING_SITE_DETAILS[site.id].category === category));
  return <section className="taiwan-observing-map">
    <div className="site-map-filters" role="group" aria-label={zh ? "地點分類" : "Site category"}>{categories.map((value) => <button key={value} type="button" className={category === value ? "active" : ""} aria-pressed={category === value} onClick={() => setCategory(value)}>{categoryName(value)}</button>)}</div>
    <div className="taiwan-map-stage">
      <svg viewBox="0 0 180 360" role="img" aria-label={zh ? "台灣觀星地點示意圖" : "Taiwan observing-site diagram"}>
        <path className="taiwan-outline" d="M116 5 C139 20 151 56 145 92 C140 124 128 151 124 180 C119 218 105 257 83 294 C67 321 50 349 31 355 C22 341 26 316 38 287 C53 251 58 218 59 181 C60 145 68 107 79 70 C88 39 100 14 116 5 Z" />
        {visibleSites.map((site) => { const position = project(site); return <g key={site.id} className={`site-map-marker${selectedSite.id === site.id ? " selected" : ""}`} transform={`translate(${position.x} ${position.y})`} onClick={() => onChange(site.id)} role="button" tabIndex={0} aria-label={site.name[locale]} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onChange(site.id); }}><circle r="7" /><circle r="2.5" /></g>; })}
      </svg>
      <div className="site-map-list">{visibleSites.map((site) => <button key={site.id} type="button" className={selectedSite.id === site.id ? "active" : ""} onClick={() => onChange(site.id)}><span>{site.name[locale]}</span><small>{site.elevationMeters?.toLocaleString(locale) ?? "—"} m</small></button>)}</div>
    </div>
    {details ? <article className="site-map-details"><header><div><h3>{selectedSite.name[locale]}</h3><p>{selectedSite.region[locale]}</p></div><strong>{selectedSite.elevationMeters?.toLocaleString(locale)} m</strong></header><dl><div><dt>{zh ? "光害概況" : "Light pollution"}</dt><dd>{details.lightPollution[locale]}</dd></div><div><dt>{zh ? "視野" : "Horizon"}</dt><dd>{details.horizon[locale]}</dd></div><div><dt>{zh ? "交通／停車" : "Access / parking"}</dt><dd>{details.access[locale]}</dd></div><div><dt>{zh ? "注意事項" : "Caution"}</dt><dd>{details.caution[locale]}</dd></div></dl></article> : <p className="site-map-custom-note">{zh ? "自訂地點沒有內建場地資訊。" : "Custom locations do not include bundled site details."}</p>}
    <small>{zh ? "資訊為靜態規劃參考；出發前請查詢道路、園區、停車與天候最新公告。" : "Static planning reference only; check current road, park, parking, and weather notices before travel."}</small>
  </section>;
}
