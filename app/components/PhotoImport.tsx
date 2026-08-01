"use client";
/* eslint-disable @next/next/no-img-element -- Local blob previews cannot use the static image optimizer. */

import { useRef, useState } from "react";
import type { Locale } from "../i18n/types";
import { hasExifData, readJpegExif, type PhotoExif } from "../simulation/exif";

export type ImportedPhoto = { previewUrl: string; fileName: string; exif: PhotoExif };

export function PhotoImport({ locale, photo, onImport, onClear }: { locale: Locale; photo: ImportedPhoto | null; onImport: (photo: ImportedPhoto) => void; onClear: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const zh = locale === "zh-TW";
  const choose = async (file?: File) => {
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { setMessage(zh ? "檔案不可超過 30 MB。" : "File exceeds 30 MB."); return; }
    if (!file.type.startsWith("image/")) { setMessage(zh ? "請選擇圖片檔案。" : "Choose an image file."); return; }
    setMessage("");
    try {
      const metadata = readJpegExif(await file.arrayBuffer());
      onImport({ previewUrl: URL.createObjectURL(file), fileName: file.name, exif: metadata });
      if (!hasExifData(metadata)) setMessage(zh ? "找不到可讀取的 JPEG EXIF，之後仍可手動輸入拍攝資料。" : "No readable JPEG EXIF found; values can be entered manually later.");
    } catch { setMessage(zh ? "無法讀取照片中繼資料。" : "Could not read photo metadata."); }
  };
  const clear = () => { onClear(); setMessage(""); if (inputRef.current) inputRef.current.value = ""; };
  const value = (input: string | number | null | undefined, suffix = "") => input === null || input === undefined || input === "" ? "—" : `${input}${suffix}`;
  return <section className="photo-import">
    <div className="photo-privacy"><strong>{zh ? "照片隱私" : "Photo privacy"}</strong><p>{zh ? "照片與 EXIF 只在目前瀏覽器分頁處理，不會自動上傳或保存。" : "The photo and EXIF are processed only in this browser tab and are not uploaded or stored automatically."}</p></div>
    <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={(event) => void choose(event.target.files?.[0])} />
    {!photo ? <button className="photo-import-button" type="button" onClick={() => inputRef.current?.click()}>{zh ? "選擇本機照片" : "Choose local photo"}</button> : <><div className="photo-import-preview"><img src={photo.previewUrl} alt={zh ? "匯入照片預覽" : "Imported photo preview"} /><span>{photo.fileName}</span><button type="button" onClick={clear} aria-label={zh ? "移除照片" : "Remove photo"}>×</button></div><dl><div><dt>{zh ? "相機" : "Camera"}</dt><dd>{[photo.exif.make, photo.exif.model].filter(Boolean).join(" ") || "—"}</dd></div><div><dt>{zh ? "拍攝時間" : "Captured"}</dt><dd>{value(photo.exif.capturedAt)}{photo.exif.capturedAtOffset ? ` UTC${photo.exif.capturedAtOffset}` : ""}</dd></div><div><dt>{zh ? "焦距" : "Focal length"}</dt><dd>{value(photo.exif.focalLengthMm, " mm")}</dd></div><div><dt>{zh ? "35mm 等效焦距" : "35mm equivalent"}</dt><dd>{value(photo.exif.focalLength35Mm, " mm")}</dd></div><div><dt>GPS</dt><dd>{photo.exif.latitude === null || photo.exif.longitude === null ? "—" : `${photo.exif.latitude.toFixed(5)}, ${photo.exif.longitude.toFixed(5)}`}</dd></div><div><dt>{zh ? "海拔" : "Altitude"}</dt><dd>{value(photo.exif.altitudeMeters?.toFixed(0), " m")}</dd></div><div><dt>{zh ? "拍攝方向" : "Image direction"}</dt><dd>{photo.exif.headingDegrees === null ? "—" : `${photo.exif.headingDegrees.toFixed(1)}° ${photo.exif.headingReference === "true" ? "T" : photo.exif.headingReference === "magnetic" ? "M" : ""}`}</dd></div><div><dt>{zh ? "照片方向標籤" : "Orientation tag"}</dt><dd>{value(photo.exif.orientation)}</dd></div></dl></>}
    {message && <p className="photo-import-message" role="status">{message}</p>}
    <small>{zh ? "目前可靠讀取 JPEG EXIF。方向資訊只有在相機或手機有寫入 GPSImgDirection 時才會出現；PNG、WebP、HEIC 的中繼資料支援依瀏覽器而異。" : "JPEG EXIF is currently supported. Direction appears only when the camera or phone writes GPSImgDirection; PNG, WebP, and HEIC metadata support varies by browser."}</small>
  </section>;
}
