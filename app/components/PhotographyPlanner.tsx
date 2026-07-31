"use client";

import { useEffect, useState, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { Locale } from "../i18n/types";
import { GALACTIC_CORE } from "../simulation/milky-way";
import { isValidPhotographyPlan, photographyFieldOfView, type PhotographyPlan } from "../simulation/photography";

const STORAGE_KEY = "astro-shot-photography-plans";

export function PhotographyPlanner({ plan, setPlan, locale }: { plan: PhotographyPlan; setPlan: Dispatch<SetStateAction<PhotographyPlan>>; locale: Locale }) {
  const [savedPlans, setSavedPlans] = useState<PhotographyPlan[]>([]);
  const zh = locale === "zh-TW";
  const field = photographyFieldOfView(plan);
  useEffect(() => {
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(parsed)) Promise.resolve().then(() => setSavedPlans(parsed.filter(isValidPhotographyPlan).slice(0, 6)));
    } catch {}
  }, []);
  const update = <Key extends keyof PhotographyPlan>(key: Key, value: PhotographyPlan[Key]) => setPlan((current) => ({ ...current, [key]: value }));
  const save = () => {
    const next = [plan, ...savedPlans.filter((item) => JSON.stringify(item) !== JSON.stringify(plan))].slice(0, 6);
    setSavedPlans(next);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  };
  const focusCore = () => window.dispatchEvent(new CustomEvent("sky:focus-object", { detail: { label: zh ? "銀河核心" : "Galactic Core", rightAscension: GALACTIC_CORE.rightAscension, declination: GALACTIC_CORE.declination } }));
  return <section className="photography-planner">
    <div className="photo-control-grid"><label><span>{zh ? "感光元件" : "Sensor"}</span><select value={plan.sensor} onChange={(event) => update("sensor", event.target.value as PhotographyPlan["sensor"])}><option value="full-frame">{zh ? "全片幅" : "Full frame"}</option><option value="aps-c">APS-C</option><option value="micro-four-thirds">Micro Four Thirds</option><option value="phone-wide">{zh ? "手機廣角" : "Phone wide"}</option></select></label><label><span>{zh ? "畫面比例" : "Aspect"}</span><select value={plan.aspect} onChange={(event) => update("aspect", event.target.value as PhotographyPlan["aspect"])}><option>3:2</option><option>16:9</option><option>4:3</option></select></label></div>
    <label className="photo-range"><span><span>{zh ? "鏡頭焦段" : "Focal length"}</span><output>{plan.focalLengthMm} mm</output></span><input type="range" min={8} max={200} step={1} value={plan.focalLengthMm} onChange={(event) => update("focalLengthMm", Number(event.target.value))} /></label>
    <div className="photo-focal-presets">{[14, 20, 24, 35, 50].map((value) => <button key={value} type="button" className={plan.focalLengthMm === value ? "active" : ""} onClick={() => update("focalLengthMm", value)}>{value} mm</button>)}</div>
    <div className="photo-orientation"><button type="button" className={plan.orientation === "landscape" ? "active" : ""} onClick={() => update("orientation", "landscape")}>{zh ? "橫幅" : "Landscape"}</button><button type="button" className={plan.orientation === "portrait" ? "active" : ""} onClick={() => update("orientation", "portrait")}>{zh ? "直幅" : "Portrait"}</button></div>
    <label className="photo-range"><span><span>{zh ? "相機仰角" : "Camera tilt"}</span><output>{plan.cameraTiltDegrees}°</output></span><input type="range" min={-10} max={90} step={1} value={plan.cameraTiltDegrees} onChange={(event) => update("cameraTiltDegrees", Number(event.target.value))} /></label>
    <div className="photo-fov-readout"><span>{zh ? "角視野" : "Field of view"}</span><strong>{field.horizontalDegrees.toFixed(1)}° × {field.verticalDegrees.toFixed(1)}°</strong></div>
    <button className={`photo-frame-toggle${plan.frameVisible ? " active" : ""}`} type="button" aria-pressed={plan.frameVisible} onClick={() => update("frameVisible", !plan.frameVisible)}>{plan.frameVisible ? (zh ? "隱藏構圖框" : "Hide frame") : (zh ? "顯示構圖框" : "Show frame")}</button>
    <div className="photo-plan-actions"><button type="button" onClick={focusCore}>{zh ? "對準銀河核心" : "Frame Galactic Core"}</button><button type="button" onClick={save}>{zh ? "儲存方案" : "Save plan"}</button></div>
    {savedPlans.length > 0 && <div className="saved-photo-plans"><span>{zh ? "已儲存方案" : "Saved plans"}</span>{savedPlans.map((saved, index) => <button key={`${saved.sensor}-${saved.focalLengthMm}-${saved.orientation}-${index}`} type="button" onClick={() => setPlan(saved)}><span>{saved.focalLengthMm} mm · {saved.orientation === "landscape" ? (zh ? "橫幅" : "Landscape") : (zh ? "直幅" : "Portrait")}</span><small>{saved.sensor} · {saved.aspect}</small></button>)}</div>}
  </section>;
}

export function PhotographyFrame({ plan, viewFovRef, locale }: { plan: PhotographyPlan; viewFovRef: RefObject<number>; locale: Locale }) {
  const [viewFov, setViewFov] = useState(59);
  useEffect(() => {
    const update = () => setViewFov((viewFovRef.current ?? (59 * Math.PI / 180)) * 180 / Math.PI);
    update();
    const timer = window.setInterval(update, 500);
    return () => window.clearInterval(timer);
  }, [viewFovRef]);
  const field = photographyFieldOfView(plan);
  const height = Math.min(82, Math.max(8, field.verticalDegrees / viewFov * 100));
  return <div className="photography-frame" style={{ width: `min(92vw, ${height * field.aspect}vh)`, height: `${height}vh`, transform: `translate(-50%, calc(-50% - ${plan.cameraTiltDegrees * 0.18}vh))` }} aria-label={locale === "zh-TW" ? "相機構圖視野框" : "Camera composition frame"}><span>{plan.focalLengthMm} mm · {field.horizontalDegrees.toFixed(1)}° × {field.verticalDegrees.toFixed(1)}°</span><i /><i /><i /></div>;
}
