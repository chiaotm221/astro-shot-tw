import { DEG } from "./astronomy-time.ts";

export type ConstellationScope = "primary" | "all";

type EquatorialPoint = readonly [rightAscensionDegrees: number, declinationDegrees: number];

export type ConstellationFigure = {
  id: string;
  name: { "zh-TW": string; en: string };
  primary: boolean;
  points: readonly {
    equatorialX: number;
    equatorialY: number;
    equatorialZ: number;
  }[];
  segments: readonly (readonly [number, number])[];
  labelIndex: number;
};

function point([rightAscensionDegrees, declinationDegrees]: EquatorialPoint) {
  const rightAscension = rightAscensionDegrees * DEG;
  const declination = declinationDegrees * DEG;
  const cosine = Math.cos(declination);
  return {
    equatorialX: cosine * Math.cos(rightAscension),
    equatorialY: cosine * Math.sin(rightAscension),
    equatorialZ: Math.sin(declination),
  };
}

function figure(config: Omit<ConstellationFigure, "points"> & { coordinates: readonly EquatorialPoint[] }): ConstellationFigure {
  return { ...config, points: config.coordinates.map(point) };
}

export const CONSTELLATION_FIGURES: readonly ConstellationFigure[] = [
  figure({
    id: "orion", name: { "zh-TW": "獵戶座", en: "Orion" }, primary: true, labelIndex: 2,
    coordinates: [[88.793, 7.407], [81.283, 6.35], [83.001, -0.299], [84.053, -1.202], [85.19, -1.943], [86.939, -9.67], [78.634, -8.202]],
    segments: [[0, 2], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6]],
  }),
  figure({
    id: "ursa-major", name: { "zh-TW": "大熊座", en: "Ursa Major" }, primary: true, labelIndex: 3,
    coordinates: [[206.885, 49.313], [200.981, 54.925], [193.507, 55.96], [183.856, 57.033], [178.458, 53.695], [165.932, 61.751], [165.46, 56.382]],
    segments: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
  }),
  figure({
    id: "cassiopeia", name: { "zh-TW": "仙后座", en: "Cassiopeia" }, primary: true, labelIndex: 2,
    coordinates: [[2.295, 59.15], [10.127, 56.537], [14.177, 60.717], [21.454, 60.235], [28.599, 63.67]],
    segments: [[0, 1], [1, 2], [2, 3], [3, 4]],
  }),
  figure({
    id: "scorpius", name: { "zh-TW": "天蠍座", en: "Scorpius" }, primary: false, labelIndex: 3,
    coordinates: [[239.713, -26.114], [247.352, -26.432], [252.543, -34.293], [258.038, -43.239], [263.402, -37.104], [264.33, -42.998]],
    segments: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5]],
  }),
  figure({
    id: "cygnus", name: { "zh-TW": "天鵝座", en: "Cygnus" }, primary: false, labelIndex: 2,
    coordinates: [[310.358, 45.28], [305.557, 40.257], [292.68, 27.96], [296.244, 45.131], [311.552, 33.97]],
    segments: [[0, 1], [1, 2], [3, 1], [1, 4]],
  }),
  figure({
    id: "leo", name: { "zh-TW": "獅子座", en: "Leo" }, primary: false, labelIndex: 2,
    coordinates: [[152.093, 11.967], [154.993, 19.842], [168.527, 20.524], [177.265, 14.572], [176.465, 6.53], [170.981, 10.529]],
    segments: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]],
  }),
] as const;
