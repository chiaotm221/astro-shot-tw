export type PhotoPreviewMode = "stars" | "milky-way" | "star-trails";

export type PhotoPreviewSettings = {
  enabled: boolean;
  mode: PhotoPreviewMode;
  opacity: number;
  trailMinutes: number;
};

export const DEFAULT_PHOTO_PREVIEW: PhotoPreviewSettings = {
  enabled: false,
  mode: "stars",
  opacity: 0.72,
  trailMinutes: 30,
};

export function trailSampleIntervalSeconds(trailMinutes: number, maximumSamples = 120) {
  return Math.max(1, trailMinutes * 60 / maximumSamples);
}
