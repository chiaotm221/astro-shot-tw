"use client";

import { useId, useMemo, useState, type RefObject } from "react";
import type { Locale } from "../i18n/types";
import { searchCelestialObjects } from "../simulation/object-search";
import type { CelestialObject, CelestialObjectKind } from "../simulation/celestial-objects";
import { isEphemerisTimestampSupported, solarSystemPosition, type SolarSystemBodyId } from "../simulation/solar-system-ephemeris";

const COPY = {
  "zh-TW": { title: "搜尋星體", placeholder: "搜尋中文、英文名稱或編號", empty: "找不到相符的星體", hint: "輸入名稱，例如天狼星、Sirius 或 M42", focus: "移動視角至", kinds: { star: "恆星", planet: "行星", constellation: "星座", "deep-sky": "深空天體" } },
  en: { title: "Object Search", placeholder: "Search names or catalogue IDs", empty: "No matching objects", hint: "Try Sirius, Orion, or M42", focus: "Move view to", kinds: { star: "Star", planet: "Planet", constellation: "Constellation", "deep-sky": "Deep-sky object" } },
} satisfies Record<Locale, { title: string; placeholder: string; empty: string; hint: string; focus: string; kinds: Record<CelestialObjectKind, string> }>;

const SOLAR_IDS = new Set<SolarSystemBodyId>(["moon", "mercury", "venus", "mars", "jupiter", "saturn"]);

export function ObjectSearch({ locale, latitude, longitude, elevationMeters, simulationTimeRef }: { locale: Locale; latitude: number; longitude: number; elevationMeters: number; simulationTimeRef: RefObject<number> }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchCelestialObjects(query), [query]);
  const listId = useId();
  const copy = COPY[locale];

  const focusObject = (object: CelestialObject) => {
    let resolved = object;
    const timestamp = simulationTimeRef.current;
    if (SOLAR_IDS.has(object.id as SolarSystemBodyId) && isEphemerisTimestampSupported(timestamp)) {
      const position = solarSystemPosition(object.id as SolarSystemBodyId, timestamp, { latitude, longitude, elevationMeters });
      resolved = { ...object, rightAscension: position.apparentEquatorialOfDate.rightAscensionRadians, declination: position.apparentEquatorialOfDate.declinationRadians, magnitude: position.visualMagnitude };
    }
    window.dispatchEvent(new CustomEvent("sky:focus-object", { detail: { object: resolved, id: resolved.id, label: resolved.name[locale], rightAscension: resolved.rightAscension, declination: resolved.declination } }));
  };

  return <section className="object-search" aria-labelledby={`${listId}-title`}>
    <label id={`${listId}-title`} htmlFor={`${listId}-input`}>{copy.title}</label>
    <input id={`${listId}-input`} type="search" value={query} placeholder={copy.placeholder} autoComplete="off" aria-controls={listId} onChange={(event) => setQuery(event.target.value)} />
    {!query.trim() ? <p>{copy.hint}</p> : results.length === 0 ? <p role="status">{copy.empty}</p> : <ul id={listId}>
      {results.map((object) => <li key={object.id}><button type="button" onClick={() => focusObject(object)} aria-label={`${copy.focus}: ${object.name[locale]}`}><span><strong>{object.name[locale]}</strong><small>{object.name[locale === "zh-TW" ? "en" : "zh-TW"]}</small></span><em>{copy.kinds[object.kind]}</em></button></li>)}
    </ul>}
  </section>;
}
