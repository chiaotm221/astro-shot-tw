import { DEG } from "./astronomy-time.ts";

export type CelestialObjectKind = "star" | "planet" | "constellation" | "deep-sky";

export type CelestialObject = {
  id: string;
  name: { "zh-TW": string; en: string };
  aliases?: readonly string[];
  kind: CelestialObjectKind;
  rightAscension: number;
  declination: number;
  magnitude: number | null;
  distanceLightYears?: number;
  constellation?: { "zh-TW": string; en: string };
  description?: { "zh-TW": string; en: string };
};

const equatorial = (degrees: number) => degrees * DEG;

export const CELESTIAL_OBJECTS: readonly CelestialObject[] = [
  { id: "moon", name: { "zh-TW": "月球", en: "Moon" }, aliases: ["Luna", "月亮"], kind: "planet", rightAscension: 0, declination: 0, magnitude: -12.7, description: { "zh-TW": "地球唯一的天然衛星。位置由 V7.0 離線星曆動態計算。", en: "Earth's natural satellite. Its position is calculated dynamically by the offline V7.0 ephemeris." } },
  { id: "mercury", name: { "zh-TW": "水星", en: "Mercury" }, kind: "planet", rightAscension: 0, declination: 0, magnitude: -0.4 },
  { id: "venus", name: { "zh-TW": "金星", en: "Venus" }, aliases: ["晨星", "昏星"], kind: "planet", rightAscension: 0, declination: 0, magnitude: -4.1 },
  { id: "mars", name: { "zh-TW": "火星", en: "Mars" }, kind: "planet", rightAscension: 0, declination: 0, magnitude: -1 },
  { id: "jupiter", name: { "zh-TW": "木星", en: "Jupiter" }, kind: "planet", rightAscension: 0, declination: 0, magnitude: -2.2 },
  { id: "saturn", name: { "zh-TW": "土星", en: "Saturn" }, kind: "planet", rightAscension: 0, declination: 0, magnitude: 0.7 },
  { id: "sirius", name: { "zh-TW": "天狼星", en: "Sirius" }, aliases: ["Alpha Canis Majoris"], kind: "star", rightAscension: equatorial(101.2872), declination: equatorial(-16.7161), magnitude: -1.46, distanceLightYears: 8.6, constellation: { "zh-TW": "大犬座", en: "Canis Major" }, description: { "zh-TW": "夜空中最明亮的恆星。", en: "The brightest star in Earth's night sky." } },
  { id: "vega", name: { "zh-TW": "織女星", en: "Vega" }, aliases: ["Alpha Lyrae"], kind: "star", rightAscension: equatorial(279.2347), declination: equatorial(38.7837), magnitude: 0.03, distanceLightYears: 25, constellation: { "zh-TW": "天琴座", en: "Lyra" } },
  { id: "altair", name: { "zh-TW": "牛郎星", en: "Altair" }, aliases: ["河鼓二", "Alpha Aquilae"], kind: "star", rightAscension: equatorial(297.6958), declination: equatorial(8.8683), magnitude: 0.77, distanceLightYears: 16.7, constellation: { "zh-TW": "天鷹座", en: "Aquila" } },
  { id: "antares", name: { "zh-TW": "心宿二", en: "Antares" }, aliases: ["Alpha Scorpii"], kind: "star", rightAscension: equatorial(247.3519), declination: equatorial(-26.432), magnitude: 1.06 },
  { id: "betelgeuse", name: { "zh-TW": "參宿四", en: "Betelgeuse" }, aliases: ["Alpha Orionis"], kind: "star", rightAscension: equatorial(88.7929), declination: equatorial(7.4071), magnitude: 0.5 },
  { id: "polaris", name: { "zh-TW": "北極星", en: "Polaris" }, aliases: ["Alpha Ursae Minoris"], kind: "star", rightAscension: equatorial(37.9546), declination: equatorial(89.2641), magnitude: 1.98 },
  { id: "pleiades", name: { "zh-TW": "昴宿星團", en: "Pleiades" }, aliases: ["M45", "Seven Sisters"], kind: "deep-sky", rightAscension: equatorial(56.75), declination: equatorial(24.1167), magnitude: 1.6 },
  { id: "orion-nebula", name: { "zh-TW": "獵戶座大星雲", en: "Orion Nebula" }, aliases: ["M42"], kind: "deep-sky", rightAscension: equatorial(83.8221), declination: equatorial(-5.3911), magnitude: 4 },
  { id: "andromeda-galaxy", name: { "zh-TW": "仙女座星系", en: "Andromeda Galaxy" }, aliases: ["M31"], kind: "deep-sky", rightAscension: equatorial(10.6847), declination: equatorial(41.2692), magnitude: 3.44 },
  { id: "orion", name: { "zh-TW": "獵戶座", en: "Orion" }, kind: "constellation", rightAscension: equatorial(83), declination: equatorial(3), magnitude: null },
  { id: "ursa-major", name: { "zh-TW": "大熊座", en: "Ursa Major" }, aliases: ["Big Dipper", "北斗七星"], kind: "constellation", rightAscension: equatorial(165), declination: equatorial(56), magnitude: null },
  { id: "scorpius", name: { "zh-TW": "天蠍座", en: "Scorpius" }, aliases: ["Scorpio"], kind: "constellation", rightAscension: equatorial(253), declination: equatorial(-27), magnitude: null },
];

export const RECOMMENDATION_OBJECTS = CELESTIAL_OBJECTS.filter(
  (object) => object.kind === "star" || object.kind === "deep-sky",
);

export const SOLAR_SYSTEM_OBJECTS = CELESTIAL_OBJECTS.filter(
  (object) => object.kind === "planet",
);
