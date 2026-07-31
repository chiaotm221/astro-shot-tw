"use client";

import { useId, useMemo, useState } from "react";
import type { Locale } from "../i18n/types";
import { searchCelestialObjects } from "../simulation/object-search";
import type { CelestialObject, CelestialObjectKind } from "../simulation/celestial-objects";

const COPY = {
  "zh-TW": { title: "搜尋星體", placeholder: "搜尋中文、英文名稱或編號", empty: "找不到相符的星體", hint: "輸入名稱，例如天狼星、Sirius 或 M42", focus: "移動視角至", kinds: { star: "恆星", planet: "行星", constellation: "星座", "deep-sky": "深空天體" } },
  en: { title: "Object Search", placeholder: "Search names or catalogue IDs", empty: "No matching objects", hint: "Try Sirius, Orion, or M42", focus: "Move view to", kinds: { star: "Star", planet: "Planet", constellation: "Constellation", "deep-sky": "Deep-sky object" } },
} satisfies Record<Locale, { title: string; placeholder: string; empty: string; hint: string; focus: string; kinds: Record<CelestialObjectKind, string> }>;

export function ObjectSearch({ locale }: { locale: Locale }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchCelestialObjects(query), [query]);
  const listId = useId();
  const copy = COPY[locale];

  const focusObject = (object: CelestialObject) => window.dispatchEvent(new CustomEvent("sky:focus-object", { detail: { object, id: object.id, label: object.name[locale], rightAscension: object.rightAscension, declination: object.declination } }));

  return <section className="object-search" aria-labelledby={`${listId}-title`}>
    <label id={`${listId}-title`} htmlFor={`${listId}-input`}>{copy.title}</label>
    <input id={`${listId}-input`} type="search" value={query} placeholder={copy.placeholder} autoComplete="off" aria-controls={listId} onChange={(event) => setQuery(event.target.value)} />
    {!query.trim() ? <p>{copy.hint}</p> : results.length === 0 ? <p role="status">{copy.empty}</p> : <ul id={listId}>
      {results.map((object) => <li key={object.id}><button type="button" onClick={() => focusObject(object)} aria-label={`${copy.focus}: ${object.name[locale]}`}><span><strong>{object.name[locale]}</strong><small>{object.name[locale === "zh-TW" ? "en" : "zh-TW"]}</small></span><em>{copy.kinds[object.kind]}</em></button></li>)}
    </ul>}
  </section>;
}
