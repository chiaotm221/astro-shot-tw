export type LightPollutionProfile = {
  bortleRange: string;
  skyBrightnessRange: readonly [number, number];
  limitingMagnitudeRange: readonly [number, number];
  estimatedVisibleStars: readonly [number, number];
  baseDarknessScore: number;
  lightDomes: { "zh-TW": string; en: string };
};

export const LIGHT_POLLUTION_PROFILES: Readonly<Record<string, LightPollutionProfile>> = {
  taipei: { bortleRange: "8–9", skyBrightnessRange: [17.2, 18.3], limitingMagnitudeRange: [3.5, 4.5], estimatedVisibleStars: [50, 250], baseDarknessScore: 12, lightDomes: { "zh-TW": "各方向皆有明顯都市天光", en: "Strong urban skyglow in every direction" } },
  taichung: { bortleRange: "8–9", skyBrightnessRange: [17.4, 18.5], limitingMagnitudeRange: [3.7, 4.6], estimatedVisibleStars: [70, 300], baseDarknessScore: 15, lightDomes: { "zh-TW": "市中心方向天光最強", en: "Strongest skyglow toward the city center" } },
  tainan: { bortleRange: "8", skyBrightnessRange: [17.8, 18.8], limitingMagnitudeRange: [4, 4.8], estimatedVisibleStars: [100, 400], baseDarknessScore: 20, lightDomes: { "zh-TW": "都市方向有廣泛天光", en: "Broad skyglow toward the urban area" } },
  kaohsiung: { bortleRange: "8–9", skyBrightnessRange: [17.3, 18.4], limitingMagnitudeRange: [3.6, 4.5], estimatedVisibleStars: [60, 280], baseDarknessScore: 14, lightDomes: { "zh-TW": "市區與港區方向天光明顯", en: "Strong glow toward the city and harbor" } },
  hehuanshan: { bortleRange: "3–4", skyBrightnessRange: [21.1, 21.7], limitingMagnitudeRange: [6.4, 7], estimatedVisibleStars: [2500, 4500], baseDarknessScore: 88, lightDomes: { "zh-TW": "低空可能見遠方都市光穹", en: "Distant light domes may appear near the horizon" } },
  alishan: { bortleRange: "4", skyBrightnessRange: [20.8, 21.4], limitingMagnitudeRange: [6.1, 6.7], estimatedVisibleStars: [1800, 3500], baseDarknessScore: 78, lightDomes: { "zh-TW": "西側低空可能受平原城市影響", en: "Western low horizon may be affected by plains cities" } },
  kenting: { bortleRange: "4–5", skyBrightnessRange: [20.2, 21.1], limitingMagnitudeRange: [5.8, 6.5], estimatedVisibleStars: [1200, 2800], baseDarknessScore: 68, lightDomes: { "zh-TW": "聚落方向較亮，南方海面通常較暗", en: "Brighter toward settlements; usually darker over the southern sea" } },
};

export function combinedDarknessScore(profile: LightPollutionProfile, moonIllumination: number, moonAltitudeDegrees: number) {
  const moonPenalty = moonAltitudeDegrees > 0 ? moonIllumination * (18 + Math.min(22, moonAltitudeDegrees / 3)) : 0;
  return Math.round(Math.max(0, Math.min(100, profile.baseDarknessScore - moonPenalty)));
}

export function formatRange(range: readonly [number, number], digits = 0) {
  return `${range[0].toFixed(digits)}–${range[1].toFixed(digits)}`;
}
