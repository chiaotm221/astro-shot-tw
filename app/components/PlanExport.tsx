"use client";

import { useState, type RefObject } from "react";
import type { Locale } from "../i18n/types";
import type { ObservingSite } from "../simulation/observing-sites";
import type { PhotographyPlan } from "../simulation/photography";
import type { PhotoAlignment } from "../simulation/photo-alignment";
import type { PhotoPreviewSettings } from "../simulation/photo-preview";
import { buildPhotographyPlanExport, externalAiHandoffPrompt } from "../simulation/plan-export";
import type { ImportedPhoto } from "./PhotoImport";

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = name; anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function PlanExport({ photo, alignment, camera, preview, site, simulationTimeRef, sourceCanvasRef, locale }: { photo: ImportedPhoto | null; alignment: PhotoAlignment; camera: PhotographyPlan; preview: PhotoPreviewSettings; site: ObservingSite; simulationTimeRef: RefObject<number>; sourceCanvasRef: RefObject<HTMLCanvasElement | null>; locale: Locale }) {
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("");
  const zh = locale === "zh-TW";
  const createPlan = () => buildPhotographyPlanExport({
    simulationTime: new Date(simulationTimeRef.current || 0).toISOString(),
    site: { name: site.name[locale], latitude: site.latitude, longitude: site.longitude, elevationMeters: site.elevationMeters ?? null },
    camera, originalExif: photo?.exif ?? null, confirmedCapture: photo ? alignment : null, preview,
  });
  const exportJson = () => downloadBlob(new Blob([JSON.stringify(createPlan(), null, 2)], { type: "application/json" }), "astro-shot-plan.json");
  const exportPreview = async () => {
    const source = sourceCanvasRef.current;
    if (!source || !photo) return;
    setStatus(zh ? "正在產生本機預覽…" : "Generating local preview…");
    try {
      const image = new Image(); image.src = photo.previewUrl; await image.decode();
      const canvas = document.createElement("canvas"); canvas.width = source.width; canvas.height = source.height;
      const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas unavailable");
      context.fillStyle = "#000"; context.fillRect(0, 0, canvas.width, canvas.height);
      const rotation = alignment.orientation === 6 ? Math.PI / 2 : alignment.orientation === 8 ? -Math.PI / 2 : 0;
      const rotated = Math.abs(rotation) > 0;
      const naturalWidth = rotated ? image.naturalHeight : image.naturalWidth;
      const naturalHeight = rotated ? image.naturalWidth : image.naturalHeight;
      const fit = Math.min(canvas.width / naturalWidth, canvas.height / naturalHeight) * alignment.scale;
      context.save();
      context.translate(canvas.width * (0.5 + alignment.offsetX / 100), canvas.height * (0.5 + alignment.offsetY / 100));
      context.rotate(rotation); context.globalAlpha = Math.min(1, alignment.opacity + 0.25);
      context.drawImage(image, -image.naturalWidth * fit / 2, -image.naturalHeight * fit / 2, image.naturalWidth * fit, image.naturalHeight * fit);
      context.restore();
      if (preview.enabled) { context.globalCompositeOperation = "screen"; context.globalAlpha = preview.opacity; context.drawImage(source, 0, 0, canvas.width, canvas.height); }
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("PNG export failed");
      downloadBlob(blob, "astro-shot-preview.png"); setStatus(zh ? "預覽已在本機匯出。" : "Preview exported locally.");
    } catch { setStatus(zh ? "無法產生預覽。" : "Could not generate preview."); }
  };
  const exportHandoff = () => {
    if (!consent) return;
    downloadBlob(new Blob([externalAiHandoffPrompt(createPlan())], { type: "text/plain" }), "astro-shot-ai-handoff.txt");
    setStatus(zh ? "已產生交接文字；照片仍未上傳。" : "Handoff text created; the photo was not uploaded.");
  };
  return <section className="plan-export">
    <div className="local-export"><h3>{zh ? "本機匯出" : "Local export"}</h3><p>{zh ? "方案 JSON 不包含原始照片；PNG 預覽只在此裝置合成。" : "The plan JSON excludes the original photo; the PNG preview is composed only on this device."}</p><div><button type="button" onClick={exportJson}>{zh ? "匯出方案 JSON" : "Export plan JSON"}</button><button type="button" disabled={!photo} onClick={() => void exportPreview()}>{zh ? "匯出預覽 PNG" : "Export preview PNG"}</button></div></div>
    <div className="external-ai-handoff"><h3>{zh ? "選配外部 AI 交接" : "Optional external AI handoff"}</h3><p>{zh ? "目前沒有設定或呼叫任何 AI 供應商。交接包只有提示文字與方案資料；若日後選擇供應商，照片可能離開本機，須另行確認其隱私與保存政策。" : "No AI provider is configured or called. The handoff contains only prompt text and plan data. If a provider is chosen later, the photo may leave this device and its privacy and retention policy must be reviewed separately."}</p><label><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /><span>{zh ? "我了解外部 AI 流程未來可能傳送照片，且本次只產生交接檔、不會上傳。" : "I understand a future external AI flow may transmit the photo, and this action only creates a handoff file without uploading."}</span></label><button type="button" disabled={!consent} onClick={exportHandoff}>{zh ? "產生 AI 交接包" : "Create AI handoff"}</button></div>
    {status && <p role="status">{status}</p>}
  </section>;
}
