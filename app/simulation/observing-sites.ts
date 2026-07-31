export interface ObservingSite {
  id: string;
  name: {
    "zh-TW": string;
    en: string;
  };
  region: {
    "zh-TW": string;
    en: string;
  };
  latitude: number;
  longitude: number;
  elevationMeters?: number;
}

export const OBSERVING_SITES: readonly ObservingSite[] = [
  {
    id: "taipei",
    name: { "zh-TW": "臺北", en: "Taipei" },
    region: { "zh-TW": "臺北市", en: "Taipei City" },
    latitude: 25.033,
    longitude: 121.5654,
    elevationMeters: 10,
  },
  {
    id: "taichung",
    name: { "zh-TW": "臺中", en: "Taichung" },
    region: { "zh-TW": "臺中市", en: "Taichung City" },
    latitude: 24.1477,
    longitude: 120.6736,
    elevationMeters: 85,
  },
  {
    id: "tainan",
    name: { "zh-TW": "臺南", en: "Tainan" },
    region: { "zh-TW": "臺南市", en: "Tainan City" },
    latitude: 22.9999,
    longitude: 120.2269,
    elevationMeters: 15,
  },
  {
    id: "kaohsiung",
    name: { "zh-TW": "高雄", en: "Kaohsiung" },
    region: { "zh-TW": "高雄市", en: "Kaohsiung City" },
    latitude: 22.6273,
    longitude: 120.3014,
    elevationMeters: 9,
  },
  {
    id: "hehuanshan",
    name: { "zh-TW": "合歡山", en: "Hehuanshan" },
    region: { "zh-TW": "南投／花蓮交界", en: "Nantou–Hualien border" },
    latitude: 24.142,
    longitude: 121.284,
    elevationMeters: 3275,
  },
  {
    id: "alishan",
    name: { "zh-TW": "阿里山", en: "Alishan" },
    region: { "zh-TW": "嘉義縣", en: "Chiayi County" },
    latitude: 23.51,
    longitude: 120.805,
    elevationMeters: 2216,
  },
  {
    id: "kenting",
    name: { "zh-TW": "墾丁", en: "Kenting" },
    region: { "zh-TW": "屏東縣", en: "Pingtung County" },
    latitude: 21.946,
    longitude: 120.796,
    elevationMeters: 20,
  },
] as const;

export const TAIWAN_OBSERVING_SITES = OBSERVING_SITES;

export const DEFAULT_OBSERVING_SITE = OBSERVING_SITES[0];

export function getObservingSiteById(id: string | null | undefined) {
  return OBSERVING_SITES.find((site) => site.id === id) ?? DEFAULT_OBSERVING_SITE;
}

export function isValidLatitude(value: number) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

export function isValidLongitude(value: number) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

export function isValidObservingSite(value: unknown): value is ObservingSite {
  if (!value || typeof value !== "object") return false;
  const site = value as Partial<ObservingSite>;
  return (
    typeof site.id === "string" &&
    typeof site.name?.["zh-TW"] === "string" &&
    typeof site.name?.en === "string" &&
    typeof site.region?.["zh-TW"] === "string" &&
    typeof site.region?.en === "string" &&
    typeof site.latitude === "number" &&
    isValidLatitude(site.latitude) &&
    typeof site.longitude === "number" &&
    isValidLongitude(site.longitude)
  );
}
