"use client";

import { useCallback, useEffect, useState } from "react";
import type { Locale } from "../i18n/types";
import { withBasePath } from "../site-path";

const CACHE_PREFIX = "astroshot-";
const REFRESHED_AT_KEY = "astro-shot-offline-refreshed-at";
const READY_MARKER = "/__offline-ready__";
const REQUIRED_ASSETS = ["/", "/index.html", "/manifest.webmanifest", "/data/stars.json", "/textures/eso-milky-way-panorama-4096.jpg"] as const;

type OfflineSnapshot = {
  supported: boolean;
  ready: boolean;
  starDataReady: boolean;
  cachedAssets: number;
  requiredAssets: number;
  usage: number | null;
  refreshedAt: number | null;
  updateWaiting: boolean;
};

const EMPTY_SNAPSHOT: OfflineSnapshot = { supported: true, ready: false, starDataReady: false, cachedAssets: 0, requiredAssets: REQUIRED_ASSETS.length, usage: null, refreshedAt: null, updateWaiting: false };

function formatBytes(bytes: number, locale: Locale) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} MB`;
}

async function inspectOfflineData(): Promise<OfflineSnapshot> {
  if (!("serviceWorker" in navigator) || !("caches" in window)) return { ...EMPTY_SNAPSHOT, supported: false };
  const matches = await Promise.all(REQUIRED_ASSETS.map((path) => caches.match(withBasePath(path))));
  const readyMarker = await caches.match(withBasePath(READY_MARKER));
  const registration = await navigator.serviceWorker.getRegistration(withBasePath("/"));
  const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : {};
  const storedTime = window.localStorage.getItem(REFRESHED_AT_KEY);
  const refreshedAt = storedTime ? Number(storedTime) : null;
  return {
    supported: true,
    ready: Boolean(readyMarker) && matches.every(Boolean),
    starDataReady: Boolean(matches[REQUIRED_ASSETS.indexOf("/data/stars.json")]),
    cachedAssets: matches.filter(Boolean).length + (readyMarker ? 1 : 0),
    requiredAssets: matches.length + 1,
    usage: estimate.usage ?? null,
    refreshedAt: Number.isFinite(refreshedAt) ? refreshedAt : null,
    updateWaiting: Boolean(registration?.waiting),
  };
}

function requestWorker(worker: ServiceWorker, message: object) {
  return new Promise<{ ok: boolean; cached?: number; failed?: number }>((resolve, reject) => {
    const channel = new MessageChannel();
    const timer = window.setTimeout(() => reject(new Error("Service worker response timed out")), 30000);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timer);
      resolve(event.data as { ok: boolean; cached?: number; failed?: number });
    };
    worker.postMessage(message, [channel.port2]);
  });
}

export function OfflineDataPanel({ locale }: { locale: Locale }) {
  const [snapshot, setSnapshot] = useState<OfflineSnapshot>(EMPTY_SNAPSHOT);
  const [busy, setBusy] = useState<"cache" | "remove" | "update" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const zh = locale === "zh-TW";
  const refreshStatus = useCallback(async () => {
    try { setSnapshot(await inspectOfflineData()); } catch { setSnapshot({ ...EMPTY_SNAPSHOT, supported: false }); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(refreshStatus, 0);
    if (!("serviceWorker" in navigator)) return () => window.clearTimeout(timer);
    const handleController = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", handleController);
    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener("updatefound", () => registration.installing?.addEventListener("statechange", refreshStatus));
    }).catch(() => undefined);
    return () => {
      window.clearTimeout(timer);
      navigator.serviceWorker.removeEventListener("controllerchange", handleController);
    };
  }, [refreshStatus]);

  const cacheOfflineData = async () => {
    setBusy("cache");
    setMessage(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      const worker = navigator.serviceWorker.controller ?? registration.active;
      if (!worker) throw new Error("No active service worker");
      const result = await requestWorker(worker, { type: "CACHE_OFFLINE", refresh: snapshot.ready });
      window.localStorage.setItem(REFRESHED_AT_KEY, String(Date.now()));
      await refreshStatus();
      setMessage(result.failed ? (zh ? `部分完成：${result.failed} 個資源無法下載。` : `Partially complete: ${result.failed} resources failed.`) : (zh ? "離線資料已準備完成。" : "Offline data is ready."));
    } catch {
      setMessage(zh ? "無法完成下載，請檢查網路與儲存空間。" : "Download failed. Check the network and available storage.");
    } finally { setBusy(null); }
  };

  const removeOfflineData = async () => {
    setBusy("remove");
    setMessage(null);
    try {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX)).map((name) => caches.delete(name)));
      window.localStorage.removeItem(REFRESHED_AT_KEY);
      await refreshStatus();
      setMessage(zh ? "AstroShot 離線資料已移除。" : "AstroShot offline data was removed.");
    } catch { setMessage(zh ? "無法移除離線資料。" : "Offline data could not be removed."); }
    finally { setBusy(null); }
  };

  const applyUpdate = async () => {
    setBusy("update");
    const registration = await navigator.serviceWorker.getRegistration(withBasePath("/"));
    if (registration?.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
    else {
      setMessage(zh ? "目前沒有等待中的更新。" : "No update is waiting.");
      setBusy(null);
    }
  };

  if (!snapshot.supported) return <section className="offline-data-panel"><p>{zh ? "此瀏覽器不支援離線資料管理；線上功能仍可使用。" : "This browser does not support offline data management; online features remain available."}</p></section>;
  return <section className="offline-data-panel">
    <div className={`offline-readiness ${snapshot.ready ? "ready" : "incomplete"}`}><i aria-hidden="true" /><div><strong>{snapshot.ready ? (zh ? "可離線使用" : "Ready offline") : (zh ? "尚未完整下載" : "Download incomplete")}</strong><span>{zh ? `核心資源 ${snapshot.cachedAssets}/${snapshot.requiredAssets}` : `Core assets ${snapshot.cachedAssets}/${snapshot.requiredAssets}`}</span></div></div>
    <dl><div><dt>{zh ? "星表" : "Star catalog"}</dt><dd>{snapshot.starDataReady ? (zh ? "已下載" : "Downloaded") : (zh ? "未下載" : "Missing")}</dd></div><div><dt>{zh ? "瀏覽器儲存用量" : "Browser storage use"}</dt><dd>{snapshot.usage === null ? (zh ? "不支援" : "Unavailable") : formatBytes(snapshot.usage, locale)}</dd></div><div><dt>{zh ? "最後準備時間" : "Last prepared"}</dt><dd>{snapshot.refreshedAt ? new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(snapshot.refreshedAt) : (zh ? "尚未記錄" : "Not recorded")}</dd></div></dl>
    {snapshot.updateWaiting && <div className="offline-update"><span>{zh ? "有新版 AstroShot 可套用。" : "A new AstroShot version is ready."}</span><button type="button" disabled={busy !== null} onClick={applyUpdate}>{zh ? "套用並重新載入" : "Apply and reload"}</button></div>}
    <div className="offline-actions"><button type="button" disabled={busy !== null} onClick={cacheOfflineData}>{busy === "cache" ? "…" : snapshot.ready ? (zh ? "重新整理離線資料" : "Refresh offline data") : (zh ? "下載離線資料" : "Download offline data")}</button><button className="danger" type="button" disabled={busy !== null || snapshot.cachedAssets === 0} onClick={removeOfflineData}>{busy === "remove" ? "…" : (zh ? "移除離線資料" : "Remove offline data")}</button></div>
    {message && <p className="offline-message" role="status">{message}</p>}
    <small>{zh ? "天氣屬於外部資料；離線時只會顯示最後成功取得的快取，並標示資料時間。自訂地點保留在此瀏覽器中。" : "Weather is external data. Offline mode shows only the last successful cached result with its age. Custom locations remain in this browser."}</small>
  </section>;
}
