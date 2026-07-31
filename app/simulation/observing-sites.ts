export type ObservingSite = {
  id: string;
  name: {
    "zh-TW": string;
    en: string;
  };
  latitude: number;
  longitude: number;
  elevationMeters?: number;
};

export const TAIWAN_OBSERVING_SITES: readonly ObservingSite[] = [
  {
    id: "taipei",
    name: { "zh-TW": "臺北", en: "Taipei" },
    latitude: 25.033,
    longitude: 121.5654,
    elevationMeters: 10,
  },
  {
    id: "taichung",
    name: { "zh-TW": "臺中", en: "Taichung" },
    latitude: 24.1477,
    longitude: 120.6736,
    elevationMeters: 85,
  },
  {
    id: "hehuanshan",
    name: { "zh-TW": "合歡山", en: "Hehuanshan" },
    latitude: 24.1426,
    longitude: 121.2849,
    elevationMeters: 3275,
  },
  {
    id: "alishan",
    name: { "zh-TW": "阿里山", en: "Alishan" },
    latitude: 23.5102,
    longitude: 120.805,
    elevationMeters: 2216,
  },
  {
    id: "kenting",
    name: { "zh-TW": "墾丁", en: "Kenting" },
    latitude: 21.946,
    longitude: 120.798,
    elevationMeters: 20,
  },
] as const;
