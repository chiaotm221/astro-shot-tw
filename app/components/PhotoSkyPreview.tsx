"use client";

import { useEffect, useRef, type Dispatch, type RefObject, type SetStateAction } from "react";
import type { Locale } from "../i18n/types";
import { trailSampleIntervalSeconds, type PhotoPreviewSettings } from "../simulation/photo-preview";

export function PhotoSkyPreviewControls({ settings, setSettings, hasPhoto, locale }: { settings: PhotoPreviewSettings; setSettings: Dispatch<SetStateAction<PhotoPreviewSettings>>; hasPhoto: boolean; locale: Locale }) {
  const zh = locale === "zh-TW";
  const update = <Key extends keyof PhotoPreviewSettings>(key: Key, value: PhotoPreviewSettings[Key]) => setSettings((current) => ({ ...current, [key]: value }));
  if (!hasPhoto) return <p className="photo-preview-empty">{zh ? "請先匯入並對齊照片。" : "Import and align a photo first."}</p>;
  return <section className="photo-preview-controls">
    <button className={`photo-preview-toggle${settings.enabled ? " active" : ""}`} type="button" aria-pressed={settings.enabled} onClick={() => update("enabled", !settings.enabled)}>{settings.enabled ? (zh ? "關閉照片星空預覽" : "Disable photo sky preview") : (zh ? "開啟照片星空預覽" : "Enable photo sky preview")}</button>
    <div className="photo-preview-modes" role="group" aria-label={zh ? "預覽模式" : "Preview mode"}>{(["stars", "milky-way", "star-trails"] as const).map((mode) => <button key={mode} type="button" className={settings.mode === mode ? "active" : ""} aria-pressed={settings.mode === mode} onClick={() => update("mode", mode)}>{zh ? ({ stars: "星點", "milky-way": "銀河", "star-trails": "星軌" }[mode]) : ({ stars: "Stars", "milky-way": "Milky Way", "star-trails": "Star trails" }[mode])}</button>)}</div>
    <label className="preview-range"><span><span>{zh ? "疊加強度" : "Overlay strength"}</span><output>{Math.round(settings.opacity * 100)}%</output></span><input type="range" min={0.1} max={1} step={0.01} value={settings.opacity} onChange={(event) => update("opacity", Number(event.target.value))} /></label>
    {settings.mode === "star-trails" && <><label className="preview-range"><span><span>{zh ? "星軌時間" : "Trail duration"}</span><output>{settings.trailMinutes} min</output></span><input type="range" min={5} max={120} step={5} value={settings.trailMinutes} onChange={(event) => update("trailMinutes", Number(event.target.value))} /></label><div className="trail-presets">{[5, 15, 30, 60].map((minutes) => <button key={minutes} type="button" className={settings.trailMinutes === minutes ? "active" : ""} onClick={() => update("trailMinutes", minutes)}>{minutes} min</button>)}</div></>}
    <small>{settings.mode === "star-trails" ? (zh ? "星軌依模擬時間累積；提高左側時間倍率可更快預覽。切換模式或時間長度會重新開始累積。" : "Trails accumulate in simulation time. Increase playback speed for a faster preview. Changing mode or duration restarts accumulation.") : (zh ? "預覽使用螢幕混合模式，僅供構圖參考，不代表實際曝光結果。" : "The screen-blended overlay is for composition only and does not predict an actual exposure.")}</small>
  </section>;
}

export function PhotoSkyOverlay({ sourceCanvasRef, simulationTimeRef, settings }: { sourceCanvasRef: RefObject<HTMLCanvasElement | null>; simulationTimeRef: RefObject<number>; settings: PhotoPreviewSettings }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const source = sourceCanvasRef.current;
    if (!canvas || !source || !settings.enabled) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let animationFrame = 0;
    let lastSampleTime = Number.NEGATIVE_INFINITY;
    const sampleInterval = trailSampleIntervalSeconds(settings.trailMinutes) * 1000;
    const render = () => {
      if (canvas.width !== source.width || canvas.height !== source.height) {
        canvas.width = source.width;
        canvas.height = source.height;
        lastSampleTime = Number.NEGATIVE_INFINITY;
      }
      if (settings.mode !== "star-trails") {
        context.globalCompositeOperation = "copy";
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
      } else {
        const simulationTime = simulationTimeRef.current;
        if (simulationTime - lastSampleTime >= sampleInterval || simulationTime < lastSampleTime) {
          context.globalCompositeOperation = lastSampleTime === Number.NEGATIVE_INFINITY ? "copy" : "lighten";
          context.drawImage(source, 0, 0, canvas.width, canvas.height);
          lastSampleTime = simulationTime;
        }
      }
      animationFrame = window.requestAnimationFrame(render);
    };
    context.clearRect(0, 0, canvas.width, canvas.height);
    animationFrame = window.requestAnimationFrame(render);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [settings.enabled, settings.mode, settings.trailMinutes, simulationTimeRef, sourceCanvasRef]);
  return <canvas ref={canvasRef} className={`photo-sky-overlay mode-${settings.mode}`} style={{ opacity: settings.opacity }} aria-hidden="true" />;
}
