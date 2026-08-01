"use client";

import { useState, type RefObject } from "react";
import type { Locale } from "../i18n/types";
import type { ObservingSite } from "../simulation/observing-sites";
import type { PhotographyPlan } from "../simulation/photography";
import type { PhotoAlignment } from "../simulation/photo-alignment";
import type { PhotoPreviewSettings } from "../simulation/photo-preview";
import type { ObservingWeather } from "../simulation/weather";
import { calculateMoonPosition } from "../simulation/moon";
import { buildPhotographyPlanExport, buildPhotographyPlanShareUrl, externalAiHandoffPrompt, printablePhotographyPlanHtml } from "../simulation/plan-export";
import type { ImportedPhoto } from "./PhotoImport";

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function cachedWeather(site: ObservingSite): ObservingWeather | null {
  try {
    const key = `astro-shot-weather:${site.latitude.toFixed(2)},${site.longitude.toFixed(2)}`;
    return JSON.parse(window.localStorage.getItem(key) ?? "null") as ObservingWeather | null;
  } catch { return null; }
}

export function PlanExport({ photo, alignment, camera, preview, site, simulationTimeRef, sourceCanvasRef, locale }: { photo: ImportedPhoto | null; alignment: PhotoAlignment; camera: PhotographyPlan; preview: PhotoPreviewSettings; site: ObservingSite; simulationTimeRef: RefObject<number>; sourceCanvasRef: RefObject<HTMLCanvasElement | null>; locale: Locale }) {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const zh = locale === "zh-TW";
  const createPlan = () => {
    const timestamp = simulationTimeRef.current || Date.now();
    const moon = calculateMoonPosition(timestamp);
    const weather = cachedWeather(site);
    return buildPhotographyPlanExport({
      simulationTime: new Date(timestamp).toISOString(),
      site: { name: site.name[locale], latitude: site.latitude, longitude: site.longitude, elevationMeters: site.elevationMeters ?? null },
      camera,
      originalExif: photo?.exif ?? null,
      confirmedCapture: photo ? alignment : null,
      preview,
      planning: {
        moonIlluminationPercent: Math.round(moon.illuminatedFraction * 100),
        moonAgeDays: Number(moon.ageDays.toFixed(1)),
        weather: weather ? { fetchedAt: weather.fetchedAt, cloudCoverPercent: weather.cloudCoverPercent, precipitationProbabilityPercent: weather.precipitationProbabilityPercent, humidityPercent: weather.humidityPercent, windSpeedKmh: weather.windSpeedKmh } : null,
        recommendedEquipment: `${camera.sensor} · ${camera.focalLengthMm} mm · ${camera.orientation}`,
      },
    });
  };

  const exportJson = () => downloadBlob(new Blob([JSON.stringify(createPlan(), null, 2)], { type: "application/json" }), "astro-shot-plan.json");
  const exportPreview = async () => {
    const source = sourceCanvasRef.current;
    if (!source || !photo) return;
    setStatus(zh ? "正在本機產生預覽…" : "Generating local preview…");
    try {
      const image = new Image();
      image.src = photo.previewUrl;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = source.width;
      canvas.height = source.height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas unavailable");
      context.fillStyle = "#000";
      context.fillRect(0, 0, canvas.width, canvas.height);
      const rotation = alignment.orientation === 6 ? Math.PI / 2 : alignment.orientation === 8 ? -Math.PI / 2 : 0;
      const rotated = Math.abs(rotation) > 0;
      const naturalWidth = rotated ? image.naturalHeight : image.naturalWidth;
      const naturalHeight = rotated ? image.naturalWidth : image.naturalHeight;
      const fit = Math.min(canvas.width / naturalWidth, canvas.height / naturalHeight) * alignment.scale;
      context.save();
      context.translate(canvas.width * (0.5 + alignment.offsetX / 100), canvas.height * (0.5 + alignment.offsetY / 100));
      context.rotate(rotation);
      context.globalAlpha = Math.min(1, alignment.opacity + 0.25);
      context.drawImage(image, -image.naturalWidth * fit / 2, -image.naturalHeight * fit / 2, image.naturalWidth * fit, image.naturalHeight * fit);
      context.restore();
      if (preview.enabled) {
        context.globalCompositeOperation = "screen";
        context.globalAlpha = preview.opacity;
        context.drawImage(source, 0, 0, canvas.width, canvas.height);
      }
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("PNG export failed");
      downloadBlob(blob, "astro-shot-preview.png");
      setStatus(zh ? "預覽已在本機匯出。" : "Preview exported locally.");
    } catch { setStatus(zh ? "無法產生預覽。" : "Could not generate preview."); }
  };

  const printPlan = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { setStatus(zh ? "瀏覽器阻擋了列印視窗。" : "The browser blocked the print window."); return; }
    printWindow.opener = null;
    printWindow.document.open();
    printWindow.document.write(printablePhotographyPlanHtml(createPlan(), locale));
    printWindow.document.close();
    setStatus(zh ? "請在列印視窗選擇「另存 PDF」。" : "Choose Save as PDF in the print dialog.");
  };

  const sharePlan = async () => {
    try {
      const url = buildPhotographyPlanShareUrl(createPlan(), window.location.href);
      if (navigator.share) {
        await navigator.share({ title: "AstroShot Plan", text: zh ? "AstroShot 觀測與拍攝計畫" : "AstroShot observing and photography plan", url });
        setStatus(zh ? "分享選單已開啟。" : "Share sheet opened.");
      } else {
        await navigator.clipboard.writeText(url);
        setStatus(zh ? "隱私化分享連結已複製。" : "Privacy-reduced share link copied.");
      }
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") setStatus(zh ? "無法分享此計畫。" : "Could not share this plan.");
    }
  };

  const exportHandoff = () => {
    if (!consent) return;
    downloadBlob(new Blob([externalAiHandoffPrompt(createPlan())], { type: "text/plain" }), "astro-shot-ai-handoff.txt");
    setStatus(zh ? "已建立交接文字；照片未上傳。" : "Handoff text created; the photo was not uploaded.");
  };

  return <section className="plan-export">
    <div className="local-export"><h3>{zh ? "本機匯出" : "Local export"}</h3><p>{zh ? "JSON、PNG 與列印版都在此裝置產生；列印視窗可另存為 PDF。" : "JSON, PNG, and the print view are generated on this device. The print dialog can save a PDF."}</p><div><button type="button" onClick={exportJson}>{zh ? "匯出計畫 JSON" : "Export plan JSON"}</button><button type="button" disabled={!photo} onClick={() => void exportPreview()}>{zh ? "匯出預覽 PNG" : "Export preview PNG"}</button><button type="button" onClick={printPlan}>{zh ? "列印／另存 PDF" : "Print / Save PDF"}</button></div></div>
    <div className="plan-sharing"><h3>{zh ? "分享計畫" : "Share plan"}</h3><p>{zh ? "分享連結只放在網址片段中，並移除原始 EXIF 與確認拍攝資料；地點、時間和相機設定仍會包含在連結內。" : "The link stays in the URL fragment and removes original EXIF and confirmed capture data. It still includes the planned site, time, and camera settings."}</p><button type="button" onClick={() => void sharePlan()}>{zh ? "分享或複製連結" : "Share or copy link"}</button></div>
    <div className="external-ai-handoff"><h3>{zh ? "選配外部 AI 交接" : "Optional external AI handoff"}</h3><p>{zh ? "目前不會呼叫任何 AI 供應商。交接檔只有提示文字和計畫資料；照片不會自動上傳。" : "No AI provider is called. The handoff contains prompt text and plan data only; the photo is not uploaded automatically."}</p><label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{zh ? "我了解未來的外部 AI 流程可能傳送照片，而這個動作只會建立本機交接檔。" : "I understand a future external AI flow may transmit the photo, while this action only creates a local handoff file."}</span></label><button type="button" disabled={!consent} onClick={exportHandoff}>{zh ? "建立 AI 交接檔" : "Create AI handoff"}</button></div>
    {status && <p role="status">{status}</p>}
  </section>;
}
