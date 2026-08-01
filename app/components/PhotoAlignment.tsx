"use client";
/* eslint-disable @next/next/no-img-element -- Local blob previews cannot use the static image optimizer. */

import type { Dispatch, SetStateAction } from "react";
import type { Locale } from "../i18n/types";
import type { ImportedPhoto } from "./PhotoImport";
import { exifFieldMatches, type PhotoAlignment as Alignment } from "../simulation/photo-alignment";

export function PhotoAlignmentControls({ photo, alignment, setAlignment, onApply, locale }: { photo: ImportedPhoto; alignment: Alignment; setAlignment: Dispatch<SetStateAction<Alignment>>; onApply: (alignment: Alignment) => void; locale: Locale }) {
  const zh = locale === "zh-TW";
  const update = <Key extends keyof Alignment>(key: Key, value: Alignment[Key]) => setAlignment((current) => ({ ...current, [key]: value }));
  const source = (key: Parameters<typeof exifFieldMatches>[2]) => <small className={exifFieldMatches(alignment, photo.exif, key) ? "exif" : "manual"}>{exifFieldMatches(alignment, photo.exif, key) ? "EXIF" : (zh ? "手動" : "Manual")}</small>;
  const optionalNumber = (value: string) => value.trim() === "" ? null : Number(value);
  return <section className="photo-alignment-controls">
    <div className="alignment-fields">
      <label><span>{zh ? "拍攝時間" : "Capture time"}{source("capturedAt")}</span><input type="datetime-local" step={1} value={alignment.capturedAt} onChange={(event) => setAlignment((current) => ({ ...current, capturedAt: event.target.value, capturedAtOffset: null }))} /><small>{alignment.capturedAtOffset ? `${zh ? "EXIF 時區" : "EXIF time zone"} UTC${alignment.capturedAtOffset}` : (zh ? "未提供時區；套用前請確認為拍攝地當地時間" : "No time zone; confirm this is local capture time")}</small></label>
      <label><span>{zh ? "焦距" : "Focal length"}{source("focalLengthMm")}</span><input type="number" min={1} max={2000} value={alignment.focalLengthMm ?? ""} onChange={(event) => update("focalLengthMm", optionalNumber(event.target.value))} /></label>
      <label><span>{zh ? "緯度" : "Latitude"}{source("latitude")}</span><input type="number" min={-90} max={90} step="any" value={alignment.latitude ?? ""} onChange={(event) => update("latitude", optionalNumber(event.target.value))} /></label>
      <label><span>{zh ? "經度" : "Longitude"}{source("longitude")}</span><input type="number" min={-180} max={180} step="any" value={alignment.longitude ?? ""} onChange={(event) => update("longitude", optionalNumber(event.target.value))} /></label>
      <label><span>{zh ? "海拔" : "Elevation"}{source("elevationMeters")}</span><input type="number" step="1" value={alignment.elevationMeters ?? ""} onChange={(event) => update("elevationMeters", optionalNumber(event.target.value))} /></label>
      <label><span>{zh ? "照片旋轉方向" : "EXIF orientation"}{source("orientation")}</span><select value={alignment.orientation} onChange={(event) => update("orientation", Number(event.target.value))}><option value={1}>{zh ? "正常" : "Normal"}</option><option value={3}>180°</option><option value={6}>90°</option><option value={8}>−90°</option></select></label>
    </div>
    <label className="alignment-range"><span><span>{zh ? "相機方位" : "Camera azimuth"}{source("azimuthDegrees")}</span><output>{alignment.azimuthDegrees}°</output></span><input type="range" min={0} max={359} step={1} value={alignment.azimuthDegrees} onChange={(event) => update("azimuthDegrees", Number(event.target.value))} /></label>
    <label className="alignment-range"><span><span>{zh ? "相機仰角" : "Camera tilt"}<small className="manual">{zh ? "手動" : "Manual"}</small></span><output>{alignment.tiltDegrees}°</output></span><input type="range" min={-10} max={90} step={1} value={alignment.tiltDegrees} onChange={(event) => update("tiltDegrees", Number(event.target.value))} /></label>
    <div className="alignment-transform-grid"><label><span>{zh ? "照片透明度" : "Photo opacity"}</span><input type="range" min={0.1} max={1} step={0.01} value={alignment.opacity} onChange={(event) => update("opacity", Number(event.target.value))} /></label><label><span>{zh ? "照片縮放" : "Photo scale"}</span><input type="range" min={0.5} max={2} step={0.01} value={alignment.scale} onChange={(event) => update("scale", Number(event.target.value))} /></label><label><span>{zh ? "水平位移" : "Horizontal offset"}</span><input type="range" min={-50} max={50} step={1} value={alignment.offsetX} onChange={(event) => update("offsetX", Number(event.target.value))} /></label><label><span>{zh ? "垂直位移" : "Vertical offset"}</span><input type="range" min={-50} max={50} step={1} value={alignment.offsetY} onChange={(event) => update("offsetY", Number(event.target.value))} /></label></div>
    <button className="apply-photo-alignment" type="button" disabled={alignment.latitude === null || alignment.longitude === null || !alignment.capturedAt} onClick={() => onApply(alignment)}>{zh ? "套用拍攝資料到模擬器" : "Apply capture data to simulator"}</button>
    <small>{zh ? "GPS、時間、海拔、焦距與照片方向會優先採用 EXIF。若照片包含 GPS 拍攝方向，也會自動設定相機方位；仰角沒有通用 EXIF 標準，需手動確認。" : "GPS, time, elevation, focal length, and image orientation prefer EXIF values. GPS image direction also sets camera azimuth when present; camera tilt has no universal EXIF tag and requires confirmation."}</small>
  </section>;
}

export function AlignedPhotoOverlay({ photo, alignment }: { photo: ImportedPhoto; alignment: Alignment }) {
  const rotation = alignment.orientation === 3 ? 180 : alignment.orientation === 6 ? 90 : alignment.orientation === 8 ? -90 : 0;
  return <div className="aligned-photo-overlay" style={{ opacity: alignment.opacity }} aria-hidden="true"><img src={photo.previewUrl} alt="" style={{ transform: `translate(${alignment.offsetX}%, ${alignment.offsetY}%) scale(${alignment.scale}) rotate(${rotation}deg)` }} /></div>;
}
