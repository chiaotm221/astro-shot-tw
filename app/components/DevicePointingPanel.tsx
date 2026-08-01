"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Locale } from "../i18n/types";
import { circularLerpDegrees, linearLerp, normalizeHeadingDegrees, orientationToView } from "../simulation/device-pointing.mjs";

type SensorStatus = "idle" | "requesting" | "live" | "locked" | "denied" | "unsupported" | "relative" | "no-data";
type SensorReading = { azimuthDegrees: number; altitudeDegrees: number; accuracyDegrees: number | null; north: "true" | "magnetic" };
type SafariOrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
type PermissionCapableOrientation = typeof DeviceOrientationEvent & { requestPermission?: (absolute?: boolean) => Promise<"granted" | "denied"> };

export function DevicePointingPanel({ locale }: { locale: Locale }) {
  const zh = locale === "zh-TW";
  const [status, setStatus] = useState<SensorStatus>("idle");
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [calibrationDegrees, setCalibrationDegrees] = useState(0);
  const activeRef = useRef(false);
  const lockedRef = useRef(false);
  const calibrationRef = useRef(0);
  const smoothedRef = useRef<{ azimuthDegrees: number; altitudeDegrees: number } | null>(null);
  const lastEventAtRef = useRef(0);
  const displayUpdatedAtRef = useRef(0);
  const noDataTimerRef = useRef<number | null>(null);

  useEffect(() => { calibrationRef.current = calibrationDegrees; }, [calibrationDegrees]);

  const stop = useCallback(() => {
    activeRef.current = false;
    lockedRef.current = false;
    smoothedRef.current = null;
    if (noDataTimerRef.current !== null) window.clearTimeout(noDataTimerRef.current);
    noDataTimerRef.current = null;
    setStatus("idle");
  }, []);

  useEffect(() => {
    const handleOrientation = (rawEvent: DeviceOrientationEvent) => {
      if (!activeRef.current || lockedRef.current) return;
      const event = rawEvent as SafariOrientationEvent;
      const pose = orientationToView(event.alpha, event.beta, event.gamma);
      if (!pose) return;
      const safariHeading = Number.isFinite(event.webkitCompassHeading) ? event.webkitCompassHeading as number : null;
      const hasAbsolute = event.type === "deviceorientationabsolute" || event.absolute;
      if (safariHeading === null && !hasAbsolute) {
        setStatus("relative");
        return;
      }
      const rawAzimuth = safariHeading ?? pose.azimuthDegrees;
      const adjustedAzimuth = normalizeHeadingDegrees(rawAzimuth + calibrationRef.current);
      const previous = smoothedRef.current;
      const smoothed = previous ? {
        azimuthDegrees: circularLerpDegrees(previous.azimuthDegrees, adjustedAzimuth, 0.18),
        altitudeDegrees: linearLerp(previous.altitudeDegrees, pose.altitudeDegrees, 0.22),
      } : { azimuthDegrees: adjustedAzimuth, altitudeDegrees: pose.altitudeDegrees };
      smoothedRef.current = smoothed;
      lastEventAtRef.current = performance.now();
      const north = safariHeading === null ? "true" : "magnetic";
      const accuracyDegrees = Number.isFinite(event.webkitCompassAccuracy) ? Math.max(0, event.webkitCompassAccuracy as number) : null;
      window.dispatchEvent(new CustomEvent("sky:sensor-view", { detail: smoothed }));
      if (performance.now() - displayUpdatedAtRef.current > 120) {
        displayUpdatedAtRef.current = performance.now();
        setReading({ ...smoothed, accuracyDegrees, north });
        setStatus("live");
      }
    };
    window.addEventListener("deviceorientationabsolute", handleOrientation);
    window.addEventListener("deviceorientation", handleOrientation);
    return () => {
      window.removeEventListener("deviceorientationabsolute", handleOrientation);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = async () => {
    if (!("DeviceOrientationEvent" in window)) { setStatus("unsupported"); return; }
    setStatus("requesting");
    try {
      const constructor = DeviceOrientationEvent as PermissionCapableOrientation;
      if (typeof constructor.requestPermission === "function") {
        const permission = await constructor.requestPermission(true);
        if (permission !== "granted") { setStatus("denied"); return; }
      }
      activeRef.current = true;
      lockedRef.current = false;
      lastEventAtRef.current = performance.now();
      setStatus("no-data");
      noDataTimerRef.current = window.setTimeout(() => {
        if (activeRef.current && performance.now() - lastEventAtRef.current >= 2500) setStatus("no-data");
      }, 2600);
    } catch {
      setStatus("denied");
    }
  };

  const toggleLock = () => {
    lockedRef.current = !lockedRef.current;
    setStatus(lockedRef.current ? "locked" : "live");
  };

  const statusText: Record<SensorStatus, string> = zh ? {
    idle: "尚未啟用", requesting: "正在請求權限…", live: "即時追蹤中", locked: "方向已鎖定", denied: "感應器權限被拒絕", unsupported: "此瀏覽器不支援方向感應器", relative: "只有相對姿態，沒有可用的北方基準", "no-data": "等待感應器資料…",
  } : {
    idle: "Not enabled", requesting: "Requesting permission…", live: "Tracking live", locked: "Direction locked", denied: "Sensor permission denied", unsupported: "Orientation sensors are unavailable", relative: "Relative pose only; no usable north reference", "no-data": "Waiting for sensor data…",
  };
  const active = status === "live" || status === "locked" || status === "relative" || status === "no-data";

  return <section className="device-pointing-panel">
    <p>{zh ? "使用手機指南針、陀螺儀與加速度計調整模擬方位及仰角。資料只在目前分頁使用。" : "Use the phone compass, gyroscope, and accelerometer to control simulated azimuth and tilt. Data stays in this tab."}</p>
    <div className="device-pointing-actions">
      {!active ? <button type="button" onClick={() => void start()} disabled={status === "requesting"}>{zh ? "使用手機方向" : "Use phone direction"}</button> : <><button type="button" onClick={toggleLock}>{status === "locked" ? (zh ? "繼續追蹤" : "Resume tracking") : (zh ? "鎖定方向" : "Lock direction")}</button><button type="button" onClick={stop}>{zh ? "停止" : "Stop"}</button></>}
    </div>
    <p className={`device-pointing-status status-${status}`} role="status">{statusText[status]}</p>
    {reading && <dl><div><dt>{zh ? "方位" : "Azimuth"}</dt><dd>{reading.azimuthDegrees.toFixed(1)}°</dd></div><div><dt>{zh ? "仰角" : "Tilt"}</dt><dd>{reading.altitudeDegrees.toFixed(1)}°</dd></div><div><dt>{zh ? "北方基準" : "North reference"}</dt><dd>{reading.north === "true" ? (zh ? "真北" : "True north") : (zh ? "磁北" : "Magnetic north")}</dd></div><div><dt>{zh ? "指南針精度" : "Compass accuracy"}</dt><dd>{reading.accuracyDegrees === null ? "—" : `±${reading.accuracyDegrees.toFixed(0)}°`}</dd></div></dl>}
    <label className="alignment-range"><span><span>{zh ? "方位校正" : "Heading calibration"}</span><output>{calibrationDegrees > 0 ? "+" : ""}{calibrationDegrees}°</output></span><input type="range" min={-45} max={45} step={1} value={calibrationDegrees} onChange={(event) => setCalibrationDegrees(Number(event.target.value))} /></label>
    <button type="button" onClick={() => setCalibrationDegrees(0)} disabled={calibrationDegrees === 0}>{zh ? "重設校正" : "Reset calibration"}</button>
    <small>{zh ? "需使用 HTTPS 並由你主動授權。磁性保護殼、腳架、車體或金屬會影響指南針；請校正後再鎖定方向。" : "HTTPS and explicit permission are required. Magnetic cases, tripods, vehicles, and nearby metal can disturb the compass; calibrate before locking."}</small>
  </section>;
}
