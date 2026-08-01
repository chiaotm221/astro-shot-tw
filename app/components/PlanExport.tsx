"use client";

import { useState, type RefObject } from "react";
import type { Locale } from "../i18n/types";
import type { ObservingSite } from "../simulation/observing-sites";
import type { PhotographyPlan } from "../simulation/photography";
import type { PhotoAlignment } from "../simulation/photo-alignment";
import type { PhotoPreviewSettings } from "../simulation/photo-preview";
import type { ObservingWeather } from "../simulation/weather";
import { calculateMoonPosition } from "../simulation/moon";
import { isEphemerisTimestampSupported, solarSystemPosition, type SolarSystemBodyId } from "../simulation/solar-system-ephemeris";
import { SKY_EXPORT_SIZES, makeLuminousPixelsTransparent, skyExportFilename } from "../simulation/sky-image-export.mjs";
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

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
}

function cachedWeather(site: ObservingSite): ObservingWeather | null {
  try {
    const key = `astro-shot-weather:${site.latitude.toFixed(2)},${site.longitude.toFixed(2)}`;
    return JSON.parse(window.localStorage.getItem(key) ?? "null") as ObservingWeather | null;
  } catch { return null; }
}

type PlanExportProps = {
  photo: ImportedPhoto | null;
  alignment: PhotoAlignment;
  camera: PhotographyPlan;
  preview: PhotoPreviewSettings;
  site: ObservingSite;
  simulationTimeRef: RefObject<number>;
  sourceCanvasRef: RefObject<HTMLCanvasElement | null>;
  trailCanvasRef: RefObject<HTMLCanvasElement | null>;
  locale: Locale;
};

export function PlanExport({ photo, alignment, camera, preview, site, simulationTimeRef, sourceCanvasRef, trailCanvasRef, locale }: PlanExportProps) {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const [exportSizeId, setExportSizeId] = useState("1920x1080");
  const [transparent, setTransparent] = useState(true);
  const zh = locale === "zh-TW";

  const createPlan = () => {
    const timestamp = simulationTimeRef.current || Date.now();
    const moon = calculateMoonPosition(timestamp);
    const weather = cachedWeather(site);
    const solarBodies: SolarSystemBodyId[] = ["moon", "mercury", "venus", "mars", "jupiter", "saturn"];
    const solarSystem = isEphemerisTimestampSupported(timestamp) ? solarBodies.map((body) => {
      const position = solarSystemPosition(body, timestamp, { latitude: site.latitude, longitude: site.longitude, elevationMeters: site.elevationMeters ?? 0 });
      return { body, azimuthDegrees: position.topocentricHorizontalAirless.azimuthDegrees, elevationDegrees: position.topocentricHorizontalAirless.elevationDegrees, illuminationPercent: Math.round(position.illuminationFraction * 100), visualMagnitude: position.visualMagnitude };
    }) : undefined;
    return buildPhotographyPlanExport({
      simulationTime: new Date(timestamp).toISOString(),
      site: { name: site.name[locale], latitude: site.latitude, longitude: site.longitude, elevationMeters: site.elevationMeters ?? null },
      camera,
      originalExif: photo?.exif ?? null,
      confirmedCapture: photo ? alignment : null,
      preview,
      planning: {
        moonIlluminationPercent: solarSystem?.find((body) => body.body === "moon")?.illuminationPercent ?? Math.round(moon.illuminatedFraction * 100),
        moonAgeDays: Number(moon.ageDays.toFixed(1)),
        weather: weather ? { fetchedAt: weather.fetchedAt, cloudCoverPercent: weather.cloudCoverPercent, precipitationProbabilityPercent: weather.precipitationProbabilityPercent, humidityPercent: weather.humidityPercent, windSpeedKmh: weather.windSpeedKmh } : null,
        recommendedEquipment: `${camera.sensor} · ${camera.focalLengthMm} mm · ${camera.orientation}`,
        solarSystem,
      },
    });
  };

  const exportSkyMaterial = async () => {
    const source = preview.mode === "star-trails" ? trailCanvasRef.current : sourceCanvasRef.current;
    const size = SKY_EXPORT_SIZES.find((candidate) => candidate.id === exportSizeId) ?? SKY_EXPORT_SIZES[0];
    if (!source || source.width === 0 || source.height === 0) {
      setStatus(zh ? "星空素材尚未準備完成。" : "Sky material is not ready yet.");
      return;
    }
    setStatus(zh ? "正在產生星空素材…" : "Generating sky material…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) throw new Error("Canvas unavailable");
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = "high";
      if (!transparent) {
        context.fillStyle = "#010308";
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.globalAlpha = preview.opacity;
      context.drawImage(source, 0, 0, canvas.width, canvas.height);
      context.globalAlpha = 1;
      if (transparent) {
        const image = context.getImageData(0, 0, canvas.width, canvas.height);
        makeLuminousPixelsTransparent(image.data);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.putImageData(image, 0, 0);
      }
      const blob = await canvasBlob(canvas);
      if (!blob) throw new Error("PNG export failed");
      const timestamp = simulationTimeRef.current || Date.now();
      downloadBlob(blob, skyExportFilename(preview.mode, transparent, timestamp, size.width, size.height));
      setStatus(zh ? "星空素材已匯出，可交給外部 AI 合成。" : "Sky material exported for external AI compositing.");
    } catch {
      setStatus(zh ? "無法產生星空素材。" : "Could not generate sky material.");
    }
  };

  const exportJson = () => downloadBlob(new Blob([JSON.stringify(createPlan(), null, 2)], { type: "application/json" }), "astro-shot-plan.json");
  const exportPreview = async () => {
    const source = sourceCanvasRef.current;
    if (!source || !photo) return;
    setStatus(zh ? "正在產生本機預覽…" : "Generating local preview…");
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
      const rotation = alignment.orientation === 3 ? Math.PI : alignment.orientation === 6 ? Math.PI / 2 : alignment.orientation === 8 ? -Math.PI / 2 : 0;
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
      const blob = await canvasBlob(canvas);
      if (!blob) throw new Error("PNG export failed");
      downloadBlob(blob, "astro-shot-preview.png");
      setStatus(zh ? "預覽已在本機匯出。" : "Preview exported locally.");
    } catch { setStatus(zh ? "無法產生預覽。" : "Could not generate preview."); }
  };

  const printPlan = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) { setStatus(zh ? "瀏覽器封鎖了列印視窗。" : "The browser blocked the print window."); return; }
    printWindow.opener = null;
    printWindow.document.open();
    printWindow.document.write(printablePhotographyPlanHtml(createPlan(), locale));
    printWindow.document.close();
    setStatus(zh ? "請在列印視窗選擇另存 PDF。" : "Choose Save as PDF in the print dialog.");
  };

  const sharePlan = async () => {
    try {
      const url = buildPhotographyPlanShareUrl(createPlan(), window.location.href);
      if (navigator.share) {
        await navigator.share({ title: "AstroShot Plan", text: zh ? "AstroShot 觀測與攝影計畫" : "AstroShot observing and photography plan", url });
        setStatus(zh ? "已開啟分享面板。" : "Share sheet opened.");
      } else {
        await navigator.clipboard.writeText(url);
        setStatus(zh ? "已複製隱私精簡版分享連結。" : "Privacy-reduced share link copied.");
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
    <div className="local-export">
      <h3>{zh ? "AI 合成素材" : "AI compositing material"}</h3>
      <p>{zh ? "輸出獨立星空或星軌 PNG；本程式不會進行合成或上傳照片。" : "Export a standalone sky or trail PNG. This app does not composite or upload photographs."}</p>
      <label><span>{zh ? "輸出尺寸" : "Output size"}</span><select value={exportSizeId} onChange={(event) => setExportSizeId(event.target.value)}>{SKY_EXPORT_SIZES.map((size) => <option key={size.id} value={size.id}>{size.label} · {size.width}×{size.height}</option>)}</select></label>
      <label><input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} /><span>{zh ? "透明背景（建議給 AI 合成）" : "Transparent background (recommended for AI)"}</span></label>
      <button type="button" onClick={() => void exportSkyMaterial()}>{zh ? `匯出${preview.mode === "star-trails" ? "星軌" : "星空"}素材 PNG` : `Export ${preview.mode === "star-trails" ? "trail" : "sky"} material PNG`}</button>
    </div>
    <div className="local-export"><h3>{zh ? "計畫與預覽" : "Plan and preview"}</h3><p>{zh ? "JSON、合成預覽與列印版都在此裝置產生。" : "JSON, composite preview, and print view are generated on this device."}</p><div><button type="button" onClick={exportJson}>{zh ? "匯出計畫 JSON" : "Export plan JSON"}</button><button type="button" disabled={!photo} onClick={() => void exportPreview()}>{zh ? "匯出合成預覽 PNG" : "Export composite preview PNG"}</button><button type="button" onClick={printPlan}>{zh ? "列印／另存 PDF" : "Print / Save PDF"}</button></div></div>
    <div className="plan-sharing"><h3>{zh ? "分享計畫" : "Share plan"}</h3><p>{zh ? "連結只保存精簡計畫資料，不包含照片或原始 EXIF。" : "The link contains reduced plan data, not the photograph or original EXIF."}</p><button type="button" onClick={() => void sharePlan()}>{zh ? "分享或複製連結" : "Share or copy link"}</button></div>
    <div className="external-ai-handoff"><h3>{zh ? "外部 AI 交接文字" : "External AI handoff text"}</h3><p>{zh ? "只建立提示文字與計畫資料，不會呼叫 AI 或上傳照片。" : "Creates prompt text and plan data only; no AI is called and no photo is uploaded."}</p><label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{zh ? "我了解需自行把素材與照片交給外部 AI。" : "I understand that I must supply the material and photo to an external AI myself."}</span></label><button type="button" disabled={!consent} onClick={exportHandoff}>{zh ? "建立 AI 交接檔" : "Create AI handoff"}</button></div>
    {status && <p role="status">{status}</p>}
  </section>;
}
