import type { PhotoExif } from "./exif.ts";
import type { PhotoAlignment } from "./photo-alignment.ts";
import type { PhotoPreviewSettings } from "./photo-preview.ts";
import { isValidPhotographyPlan, type PhotographyPlan } from "./photography.ts";

export type PhotographyPlanExport = {
  schema: "astro-shot/photography-plan";
  version: 1;
  exportedAt: string;
  simulationTime: string;
  site: { name: string; latitude: number; longitude: number; elevationMeters: number | null };
  camera: PhotographyPlan;
  originalExif: PhotoExif | null;
  confirmedCapture: PhotoAlignment | null;
  preview: PhotoPreviewSettings;
  planning?: {
    moonIlluminationPercent: number;
    moonAgeDays: number;
    weather: { fetchedAt: number; cloudCoverPercent: number; precipitationProbabilityPercent: number; humidityPercent: number; windSpeedKmh: number } | null;
    recommendedEquipment: string;
    solarSystem?: Array<{ body: string; azimuthDegrees: number; elevationDegrees: number; illuminationPercent: number; visualMagnitude: number }>;
  };
  limitations: string[];
};

export function buildPhotographyPlanExport(input: Omit<PhotographyPlanExport, "schema" | "version" | "exportedAt" | "limitations">, exportedAt = new Date().toISOString()): PhotographyPlanExport {
  return {
    schema: "astro-shot/photography-plan",
    version: 1,
    exportedAt,
    ...input,
    limitations: [
      "Manual photo alignment is not astrometric plate solving.",
      "Sky, Moon, Milky Way, weather, and light-pollution values may be approximate.",
      "The export does not include or embed the original photograph.",
    ],
  };
}

export function externalAiHandoffPrompt(plan: PhotographyPlanExport) {
  return [
    "Use the separately supplied photograph as the immutable foreground and composition reference.",
    "Preserve landmarks, people, buildings, terrain, perspective, crop, and camera geometry.",
    "Composite a natural night sky consistent with the confirmed capture data below.",
    "Do not invent camera metadata or claim scientific/astrometric accuracy.",
    "Avoid oversized stars, excessive saturation, repeated star patterns, and an unnaturally bright Milky Way.",
    "",
    JSON.stringify(plan, null, 2),
  ].join("\n");
}

const BASE64URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let result = "";
  for (let index = 0; index < bytes.length; index += 3) {
    const a = bytes[index];
    const b = bytes[index + 1];
    const c = bytes[index + 2];
    result += BASE64URL_ALPHABET[a >> 2];
    result += BASE64URL_ALPHABET[((a & 3) << 4) | ((b ?? 0) >> 4)];
    if (b !== undefined) result += BASE64URL_ALPHABET[((b & 15) << 2) | ((c ?? 0) >> 6)];
    if (c !== undefined) result += BASE64URL_ALPHABET[c & 63];
  }
  return result;
}

function decodeBase64Url(value: string) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid share payload");
  const bytes: number[] = [];
  for (let index = 0; index < value.length; index += 4) {
    const a = BASE64URL_ALPHABET.indexOf(value[index]);
    const b = BASE64URL_ALPHABET.indexOf(value[index + 1]);
    const c = value[index + 2] ? BASE64URL_ALPHABET.indexOf(value[index + 2]) : -1;
    const d = value[index + 3] ? BASE64URL_ALPHABET.indexOf(value[index + 3]) : -1;
    if (a < 0 || b < 0) throw new Error("Invalid share payload");
    bytes.push((a << 2) | (b >> 4));
    if (c >= 0) bytes.push(((b & 15) << 4) | (c >> 2));
    if (d >= 0) bytes.push(((c & 3) << 6) | d);
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function shareablePhotographyPlan(plan: PhotographyPlanExport): PhotographyPlanExport {
  return { ...plan, originalExif: null, confirmedCapture: null };
}

export function buildPhotographyPlanShareUrl(plan: PhotographyPlanExport, pageUrl: string) {
  const url = new URL(pageUrl);
  url.hash = `plan=${encodeBase64Url(JSON.stringify(shareablePhotographyPlan(plan)))}`;
  if (url.href.length > 12000) throw new Error("Share link is too long");
  return url.href;
}

export function parsePhotographyPlanShareUrl(urlValue: string): PhotographyPlanExport | null {
  const value = new URL(urlValue).hash.match(/^#plan=([A-Za-z0-9_-]+)$/)?.[1];
  if (!value) return null;
  if (value.length > 16000) throw new Error("Share payload is too long");
  const parsed = JSON.parse(decodeBase64Url(value)) as Partial<PhotographyPlanExport>;
  if (parsed.schema !== "astro-shot/photography-plan" || parsed.version !== 1 || !parsed.site || typeof parsed.site.name !== "string" || !Number.isFinite(parsed.site.latitude) || !Number.isFinite(parsed.site.longitude) || !isValidPhotographyPlan(parsed.camera) || typeof parsed.simulationTime !== "string" || !Number.isFinite(Date.parse(parsed.simulationTime)) || !Array.isArray(parsed.limitations)) throw new Error("Unsupported photography plan");
  return parsed as PhotographyPlanExport;
}

function escapeHtml(value: string | number) {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export function printablePhotographyPlanHtml(plan: PhotographyPlanExport, locale: "zh-TW" | "en") {
  const zh = locale === "zh-TW";
  const time = new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(new Date(plan.simulationTime));
  const weather = plan.planning?.weather;
  const visibleSolarSystem = plan.planning?.solarSystem?.filter((body) => body.elevationDegrees >= 0).map((body) => `${body.body} ${body.azimuthDegrees.toFixed(0)}°/${body.elevationDegrees.toFixed(0)}°`).join(" · ") || "—";
  const rows = [
    [zh ? "觀測地點" : "Observing site", plan.site.name],
    [zh ? "日期與時間" : "Date and time", time],
    [zh ? "座標" : "Coordinates", `${plan.site.latitude.toFixed(4)}, ${plan.site.longitude.toFixed(4)}`],
    [zh ? "海拔" : "Elevation", plan.site.elevationMeters === null ? "—" : `${plan.site.elevationMeters} m`],
    [zh ? "相機格式" : "Sensor", plan.camera.sensor],
    [zh ? "焦段與方向" : "Lens and orientation", `${plan.camera.focalLengthMm} mm · ${plan.camera.orientation}`],
    [zh ? "建議器材" : "Recommended equipment", plan.planning?.recommendedEquipment ?? `${plan.camera.sensor}, ${plan.camera.focalLengthMm} mm`],
    [zh ? "月球照明" : "Moon illumination", plan.planning ? `${plan.planning.moonIlluminationPercent}%` : "—"],
    [zh ? "天氣摘要" : "Weather summary", weather ? `${weather.cloudCoverPercent}% ${zh ? "雲量" : "cloud"} · ${weather.precipitationProbabilityPercent}% ${zh ? "降雨" : "rain"} · ${weather.windSpeedKmh.toFixed(1)} km/h` : (zh ? "無快取資料" : "No cached data")],
    [zh ? "可見太陽系天體" : "Visible Solar System", visibleSolarSystem],
  ];
  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><title>AstroShot Plan</title><style>@page{size:A4;margin:16mm}body{font:14px system-ui,sans-serif;color:#14202b;max-width:760px;margin:auto}h1{font-size:25px;margin:0 0 4px}header p,small{color:#5c6975}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{padding:10px;border-bottom:1px solid #dce2e7;text-align:left;vertical-align:top}th{width:34%;color:#52606c}section{break-inside:avoid;padding:14px;background:#f4f7f9;border-radius:10px}ul{padding-left:20px}@media print{button{display:none}}</style></head><body><header><h1>AstroShot</h1><p>${zh ? "觀測與拍攝計畫" : "Observing and photography plan"}</p></header><table>${rows.map(([label, value]) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`).join("")}</table><section><strong>${zh ? "資料限制" : "Limitations"}</strong><ul>${plan.limitations.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section><p><small>${zh ? "本文件由瀏覽器在本機產生，不包含原始照片。" : "Generated locally in the browser. The original photo is not included."}</small></p><script>addEventListener("load",()=>setTimeout(()=>print(),100))<\/script></body></html>`;
}
