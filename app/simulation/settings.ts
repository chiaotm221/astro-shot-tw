import { DEG } from "./astronomy-time";

export type Settings = {
  rotationSpeed: number;
  latitude: number;
  starExposure: number;
  twinkle: number;
  skyBrightness: number;
  skyHue: number;
  skySaturation: number;
  noiseEnabled: boolean;
  sensorNoise: number;
  meteorRate: number;
  meteorSpeed: number;
  ordinaryMeteorRatio: number;
  fireballEnergy: number;
  ignitionTime: number;
  burstChance: number;
  burstPosition: number;
  tailLength: number;
  afterglow: number;
  meteorAngle: number;
  directionSpread: number;
  paused: boolean;
  constellationLines: boolean;
  constellationLabels: boolean;
  constellationScope: "primary" | "all";
};

export type View = {
  azimuth: number;
  altitude: number;
  fov: number;
};

export const DEFAULT_SETTINGS: Settings = {
  rotationSpeed: 1,
  latitude: 1.35,
  starExposure: 3.2,
  twinkle: 0.76,
  skyBrightness: 0.67,
  skyHue: 218,
  skySaturation: 0.4,
  noiseEnabled: true,
  sensorNoise: 0.28,
  meteorRate: 7,
  meteorSpeed: 1,
  ordinaryMeteorRatio: 74,
  fireballEnergy: 0.72,
  ignitionTime: 0.12,
  burstChance: 0.68,
  burstPosition: 0.52,
  tailLength: 1,
  afterglow: 0.55,
  meteorAngle: 11,
  directionSpread: 118,
  paused: false,
  constellationLines: true,
  constellationLabels: true,
  constellationScope: "primary",
};

export const DEFAULT_VIEW: View = {
  azimuth: 202 * DEG,
  altitude: 28 * DEG,
  fov: 59 * DEG,
};
