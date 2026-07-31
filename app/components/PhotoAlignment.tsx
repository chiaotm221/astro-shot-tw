"use client";
/* eslint-disable @next/next/no-img-element -- Local blob previews cannot use the static image optimizer. */

import type { Dispatch, SetStateAction } from "react";
import type { Locale } from "../i18n/types";
import type { ImportedPhoto } from "./PhotoImport";
import { exifFieldMatches, type PhotoAlignment as Alignment } from "../simulation/photo-alignment";

export function PhotoAlignmentControls({ photo, alignment, setAlignment, onApply, locale }: { photo: ImportedPhoto; alignment: Alignment; setAlignment: Dispatch<SetStateAction<Alignment>>; onApply: (alignment: Alignment) => void; locale: Locale }) {
  const zh = locale === "zh-TW";
  const update = <Key extends keyof Alignment>(key: Key, value: Alignment[Key]) => setAlignment((current) => ({ ...current, [key]: value }));
  const source = (key: Parameters<typeof exifFieldMatches>[2]) => <small className={exifFieldMatches(alignment, photo.exif, key) ? "exif" : "manual"}>{exifFieldMatches(alignment, photo.exif, key) ? "EXIF" : (zh ? "人工" : "Manual")}</small>;
  const optionalNumber = (value: string) => value.trim() === "" ? null : Number(value);
  return <section className="photo-alignment-controls">
    <div className="alignment-fields"><label><span>{zh ? "拍攝時間" : "Capture time"}{source("capturedAt")}</span><input type="datetime-local" step={1} value={alignment.capturedAt} onChange={(event) => update("capturedAt", event.target.value)} /></label><label><span>{zh ? "焦段" : "Focal length"}{source("focalLengthMm")}</span><input type="number" min={1} max={2000} value={alignment.focalLengthMm ?? ""} onChange={(event) => update("focalLengthMm", optionalNumber(event.target.value))} /></label><label><span>{zh ? "緯度" : "Latitude"}{source("latitude")}</span><input type="number" min={-90} max={90} step="any" value={alignment.latitude ?? ""} onChange={(event) => update("latitude", optionalNumber(event.target.value))} /></label><label><span>{zh ? "經度" : "Longitude"}{source("longitude")}</span><input type="number" min={-180} max={180} step="any" value={alignment.longitude ?? ""} onChange={(event) => update("longitude", optionalNumber(event.target.value))} /></label><label><span>{zh ? "海拔" : "Elevation"}{source("elevationMeters")}</span><input type="number" step="1" value={alignment.elevationMeters ?? ""} onChange={(event) => update("elevationMeters", optionalNumber(event.target.value))} /></label><label><span>{zh ? "EXIF 方向" : "EXIF orientation"}{source("orientation")}</span><select value={alignment.orientation} onChange={(event) => update("orientation", Number(event.target.value))}><option value={1}>{zh ? "正常" : "Normal"}</option><option value={6}>90°</option><option value={8}>−90°</option></select></label></div>
    <label className="alignment-range"><span><span>{zh ? "拍攝方位角" : "Camera azimuth"}</span><output>{alignment.azimuthDegrees}°</output></span><input type="range" min={0} max={359} step={1} value={alignment.azimuthDegrees} onChange={(event) => update("azimuthDegrees", Number(event.target.value))} /></label>
    <label className="alignment-range"><span><span>{zh ? "相機仰角" : "Camera tilt"}</span><output>{alignment.tiltDegrees}°</output></span><input type="range" min={-10} max={90} step={1} value={alignment.tiltDegrees} onChange={(event) => update("tiltDegrees", Number(event.target.value))} /></label>
    <div className="alignment-transform-grid"><label><span>{zh ? "照片透明度" : "Photo opacity"}</span><input type="range" min={0.1} max={1} step={0.01} value={alignment.opacity} onChange={(event) => update("opacity", Number(event.target.value))} /></label><label><span>{zh ? "照片縮放" : "Photo scale"}</span><input type="range" min={0.5} max={2} step={0.01} value={alignment.scale} onChange={(event) => update("scale", Number(event.target.value))} /></label><label><span>{zh ? "水平位移" : "Horizontal offset"}</span><input type="range" min={-50} max={50} step={1} value={alignment.offsetX} onChange={(event) => update("offsetX", Number(event.target.value))} /></label><label><span>{zh ? "垂直位移" : "Vertical offset"}</span><input type="range" min={-50} max={50} step={1} value={alignment.offsetY} onChange={(event) => update("offsetY", Number(event.target.value))} /></label></div>
    <button className="apply-photo-alignment" type="button" disabled={alignment.latitude === null || alignment.longitude === null || !alignment.capturedAt} onClick={() => onApply(alignment)}>{zh ? "套用拍攝資料並對齊視角" : "Apply capture data and align view"}</button>
    <small>{zh ? "EXIF 通常沒有可靠方位角與相機仰角；這兩項必須由使用者確認。套用不會修改原始照片或 EXIF。" : "EXIF usually lacks reliable azimuth and camera tilt; both require user confirmation. Applying never modifies the original photo or EXIF."}</small>
  </section>;
}

export function AlignedPhotoOverlay({ photo, alignment }: { photo: ImportedPhoto; alignment: Alignment }) {
  const rotation = alignment.orientation === 6 ? 90 : alignment.orientation === 8 ? -90 : 0;
  return <div className="aligned-photo-overlay" style={{ opacity: alignment.opacity }} aria-hidden="true"><img src={photo.previewUrl} alt="" style={{ transform: `translate(${alignment.offsetX}%, ${alignment.offsetY}%) scale(${alignment.scale}) rotate(${rotation}deg)` }} /></div>;
}
