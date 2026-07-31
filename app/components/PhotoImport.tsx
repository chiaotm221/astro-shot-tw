"use client";
/* eslint-disable @next/next/no-img-element -- Local blob previews cannot use the static image optimizer. */

import { useEffect, useRef, useState } from "react";
import type { Locale } from "../i18n/types";
import { hasExifData, readJpegExif, type PhotoExif } from "../simulation/exif";

export function PhotoImport({ locale }: { locale: Locale }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [exif, setExif] = useState<PhotoExif | null>(null);
  const [message, setMessage] = useState("");
  const zh = locale === "zh-TW";
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const choose = async (file?: File) => {
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { setMessage(zh ? "檔案超過 30 MB。" : "File exceeds 30 MB."); return; }
    if (!file.type.startsWith("image/")) { setMessage(zh ? "請選擇圖片檔案。" : "Choose an image file."); return; }
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(file));
    setFileName(file.name);
    setMessage("");
    try {
      const metadata = readJpegExif(await file.arrayBuffer());
      setExif(metadata);
      if (!hasExifData(metadata)) setMessage(zh ? "找不到可讀取的 JPEG EXIF；之後可手動輸入資料。" : "No readable JPEG EXIF found; values can be entered manually later.");
    } catch { setExif(null); setMessage(zh ? "無法讀取照片中繼資料。" : "Could not read photo metadata."); }
  };
  const clear = () => { if (preview) URL.revokeObjectURL(preview); setPreview(null); setExif(null); setFileName(""); setMessage(""); if (inputRef.current) inputRef.current.value = ""; };
  const value = (input: string | number | null | undefined, suffix = "") => input === null || input === undefined || input === "" ? "—" : `${input}${suffix}`;
  return <section className="photo-import">
    <div className="photo-privacy"><strong>{zh ? "照片隱私" : "Photo privacy"}</strong><p>{zh ? "照片與 EXIF 只在此瀏覽器分頁中處理，不會自動上傳或儲存原始檔。關閉分頁或移除照片後，預覽即失效。" : "The photo and EXIF are processed only in this browser tab. The original is not uploaded or stored automatically; the preview ends when removed or the tab closes."}</p></div>
    <input ref={inputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" onChange={(event) => void choose(event.target.files?.[0])} />
    {!preview ? <button className="photo-import-button" type="button" onClick={() => inputRef.current?.click()}>{zh ? "選擇本機照片" : "Choose local photo"}</button> : <><div className="photo-import-preview">{/* Blob URLs are local previews and cannot use the static Next image optimizer. */}<img src={preview} alt={zh ? "匯入照片預覽" : "Imported photo preview"} /><span>{fileName}</span><button type="button" onClick={clear} aria-label={zh ? "移除照片" : "Remove photo"}>×</button></div>{exif && <dl><div><dt>{zh ? "相機" : "Camera"}</dt><dd>{[exif.make, exif.model].filter(Boolean).join(" ") || "—"}</dd></div><div><dt>{zh ? "拍攝時間" : "Captured"}</dt><dd>{value(exif.capturedAt)}</dd></div><div><dt>{zh ? "焦段" : "Focal length"}</dt><dd>{value(exif.focalLengthMm, " mm")}</dd></div><div><dt>{zh ? "等效焦段" : "35mm equivalent"}</dt><dd>{value(exif.focalLength35Mm, " mm")}</dd></div><div><dt>GPS</dt><dd>{exif.latitude === null || exif.longitude === null ? "—" : `${exif.latitude.toFixed(5)}, ${exif.longitude.toFixed(5)}`}</dd></div><div><dt>{zh ? "海拔" : "Altitude"}</dt><dd>{value(exif.altitudeMeters?.toFixed(0), " m")}</dd></div><div><dt>{zh ? "畫面方向代碼" : "Orientation tag"}</dt><dd>{value(exif.orientation)}</dd></div></dl>}</>}
    {message && <p className="photo-import-message" role="status">{message}</p>}
    <small>{zh ? "目前可靠讀取 JPEG EXIF；PNG、WebP、HEIC 可預覽，但中繼資料支援依瀏覽器與檔案格式而異。" : "JPEG EXIF is currently supported. PNG, WebP, and HEIC may preview, but metadata support varies by browser and format."}</small>
  </section>;
}
