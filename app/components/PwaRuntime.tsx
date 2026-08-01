"use client";

import { useEffect, useState } from "react";
import type { Locale } from "../i18n/types";
import { withBasePath } from "../site-path";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaRuntime({ locale }: { locale: Locale }) {
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const zh = locale === "zh-TW";

  useEffect(() => {
    const initialStatus = window.setTimeout(() => setOnline(navigator.onLine), 0);
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(withBasePath("/sw.js"), {
        scope: withBasePath("/"),
      }).catch(() => undefined);
    }
    return () => {
      window.clearTimeout(initialStatus);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  if (online && !installPrompt) return null;
  return (
    <aside className={`pwa-runtime ${online ? "online" : "offline"}`} aria-live="polite">
      {!online && <span><i aria-hidden="true" />{zh ? "離線模式：天文計算與已下載資料仍可使用" : "Offline: calculations and downloaded data remain available"}</span>}
      {installPrompt && <button type="button" onClick={install}>{zh ? "安裝 AstroShot" : "Install AstroShot"}</button>}
    </aside>
  );
}
