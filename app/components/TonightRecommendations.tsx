"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import type { Locale } from "../i18n/types";
import { RECOMMENDATION_OBJECTS } from "../simulation/celestial-objects";
import { recommendTonight, type ObjectVisibility } from "../simulation/visibility";

type TonightRecommendationsProps = {
  latitude: number;
  siderealRef: RefObject<number>;
  locale: Locale;
};

const COPY = {
  "zh-TW": {
    title: "今晚的星空",
    subtitle: "依目前地點與模擬時間推薦",
    visible: "現在可見",
    low: "接近地平線",
    later: "稍後升起",
    hours: (value: number) => `約 ${value.toFixed(1)} 小時後`,
    altitude: "仰角",
    brightness: "視星等",
    approximate: "方向、仰角與升起時間皆為近似計算，不含天氣與地形遮蔽。",
    nakedEye: "肉眼",
    binoculars: "雙筒望遠鏡",
    telescope: "小型望遠鏡",
    focus: "將視角移至目標",
  },
  en: {
    title: "Tonight's Sky",
    subtitle: "Recommended for the current site and simulation time",
    visible: "Visible now",
    low: "Near the horizon",
    later: "Rises later",
    hours: (value: number) => `In about ${value.toFixed(1)} hours`,
    altitude: "Altitude",
    brightness: "Magnitude",
    approximate: "Directions, altitude, and rise times are approximate; weather and terrain are not included.",
    nakedEye: "Naked eye",
    binoculars: "Binoculars",
    telescope: "Small telescope",
    focus: "Move view to target",
  },
} as const;

function compassDirection(azimuthDegrees: number, locale: Locale) {
  const directions =
    locale === "zh-TW"
      ? ["北", "東北", "東", "東南", "南", "西南", "西", "西北"]
      : ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(azimuthDegrees / 45) % directions.length];
}

function equipmentFor(entry: ObjectVisibility, locale: Locale) {
  const copy = COPY[locale];
  if (entry.object.kind === "deep-sky" && entry.object.magnitude > 2.5) {
    return copy.telescope;
  }
  if (entry.object.kind === "deep-sky" || entry.object.magnitude > 2.5) {
    return copy.binoculars;
  }
  return copy.nakedEye;
}

export function TonightRecommendations({
  latitude,
  siderealRef,
  locale,
}: TonightRecommendationsProps) {
  const [siderealAngle, setSiderealAngle] = useState(0);
  const copy = COPY[locale];

  useEffect(() => {
    const updateSiderealAngle = () => setSiderealAngle(siderealRef.current ?? 0);
    updateSiderealAngle();
    const timer = window.setInterval(updateSiderealAngle, 30000);
    return () => window.clearInterval(timer);
  }, [siderealRef]);

  const recommendations = useMemo(
    () =>
      recommendTonight(
        RECOMMENDATION_OBJECTS,
        latitude,
        siderealAngle,
      ),
    [latitude, siderealAngle],
  );

  const focusObject = (entry: ObjectVisibility) => {
    window.dispatchEvent(
      new CustomEvent("sky:focus-object", {
        detail: {
          rightAscension: entry.object.rightAscension,
          declination: entry.object.declination,
        },
      }),
    );
  };

  return (
    <section className="tonight-recommendations" aria-labelledby="tonight-title">
      <header>
        <h3 id="tonight-title">{copy.title}</h3>
        <p>{copy.subtitle}</p>
      </header>
      <div className="tonight-object-list">
        {recommendations.map((entry) => {
          const nameLocale = locale === "zh-TW" ? "zh-TW" : "en";
          const status =
            entry.status === "visible"
              ? copy.visible
              : entry.status === "low"
                ? copy.low
                : copy.later;
          return (
            <button
              key={entry.object.id}
              className="tonight-object"
              type="button"
              onClick={() => focusObject(entry)}
              aria-label={`${copy.focus}: ${entry.object.name[nameLocale]}`}
            >
              <span className="tonight-object-heading">
                <strong>{entry.object.name[nameLocale]}</strong>
                <span>{status}</span>
              </span>
              <span className="tonight-object-meta">
                {entry.status === "later" && entry.risesInHours !== null
                  ? copy.hours(entry.risesInHours)
                  : `${compassDirection(entry.azimuthDegrees, locale)} · ${copy.altitude} ${Math.round(entry.altitudeDegrees)}°`}
                <span>{equipmentFor(entry, locale)}</span>
              </span>
              <span className="tonight-object-brightness">
                {copy.brightness} {entry.object.magnitude.toFixed(1)}
              </span>
            </button>
          );
        })}
      </div>
      <p className="tonight-approximation-note">{copy.approximate}</p>
    </section>
  );
}
