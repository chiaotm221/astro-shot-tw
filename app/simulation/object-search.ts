import { CELESTIAL_OBJECTS, type CelestialObject } from "./celestial-objects.ts";

export function normalizeSearchTerm(value: string) {
  return value.normalize("NFKD").toLocaleLowerCase("en").replace(/[\s\-_]+/g, "").trim();
}

type SearchEntry = { object: CelestialObject; terms: readonly string[] };

export function createObjectSearchIndex(objects: readonly CelestialObject[] = CELESTIAL_OBJECTS) {
  return objects.map((object): SearchEntry => ({
    object,
    terms: [object.name["zh-TW"], object.name.en, ...(object.aliases ?? [])].map(normalizeSearchTerm),
  }));
}

export const OBJECT_SEARCH_INDEX = createObjectSearchIndex();

export function searchCelestialObjects(query: string, limit = 8, index = OBJECT_SEARCH_INDEX) {
  const normalized = normalizeSearchTerm(query);
  if (!normalized) return [];
  return index
    .map((entry) => {
      const positions = entry.terms.map((term) => term.indexOf(normalized)).filter((position) => position >= 0);
      return { entry, score: positions.length ? Math.min(...positions) : Number.POSITIVE_INFINITY };
    })
    .filter(({ score }) => Number.isFinite(score))
    .sort((left, right) => left.score - right.score || (left.entry.terms[0].length - right.entry.terms[0].length))
    .slice(0, limit)
    .map(({ entry }) => entry.object);
}
