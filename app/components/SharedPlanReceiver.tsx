"use client";

import { useCallback, useEffect, useState } from "react";
import type { Locale } from "../i18n/types";
import { parsePhotographyPlanShareUrl, type PhotographyPlanExport } from "../simulation/plan-export";

export function SharedPlanReceiver({ locale }: { locale: Locale }) {
  const [plan, setPlan] = useState<PhotographyPlanExport | null>(null);
  const [invalid, setInvalid] = useState(false);
  const zh = locale === "zh-TW";
  const readLink = useCallback(() => {
    if (!window.location.hash.startsWith("#plan=")) { setPlan(null); setInvalid(false); return; }
    try { setPlan(parsePhotographyPlanShareUrl(window.location.href)); setInvalid(false); }
    catch { setPlan(null); setInvalid(true); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(readLink, 0);
    window.addEventListener("hashchange", readLink);
    return () => { window.clearTimeout(timer); window.removeEventListener("hashchange", readLink); };
  }, [readLink]);

  const close = () => {
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    setPlan(null);
    setInvalid(false);
  };
  const download = () => {
    if (!plan) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify(plan, null, 2)], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "astro-shot-shared-plan.json";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  if (!plan && !invalid) return null;
  return <aside className="shared-plan-card" role="dialog" aria-modal="false" aria-labelledby="shared-plan-title">
    <header><div><small>AstroShot</small><h2 id="shared-plan-title">{zh ? "分享的觀測計畫" : "Shared observing plan"}</h2></div><button type="button" onClick={close} aria-label={zh ? "關閉分享計畫" : "Close shared plan"}>×</button></header>
    {invalid ? <p>{zh ? "此分享連結已損壞或使用不支援的格式。" : "This share link is damaged or uses an unsupported format."}</p> : plan && <><dl><div><dt>{zh ? "地點" : "Site"}</dt><dd>{plan.site.name}</dd></div><div><dt>{zh ? "時間" : "Time"}</dt><dd>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(plan.simulationTime))}</dd></div><div><dt>{zh ? "相機" : "Camera"}</dt><dd>{plan.camera.sensor} · {plan.camera.focalLengthMm} mm · {plan.camera.orientation}</dd></div><div><dt>{zh ? "月球照明" : "Moon"}</dt><dd>{plan.planning ? `${plan.planning.moonIlluminationPercent}%` : "—"}</dd></div></dl><p>{zh ? "連結不含原始 EXIF、確認拍攝資料或照片。" : "The link excludes original EXIF, confirmed capture data, and the photograph."}</p><button className="shared-plan-download" type="button" onClick={download}>{zh ? "下載計畫 JSON" : "Download plan JSON"}</button></>}
  </aside>;
}
