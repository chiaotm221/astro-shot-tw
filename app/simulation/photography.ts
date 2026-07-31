export type SensorFormat = "full-frame" | "aps-c" | "micro-four-thirds" | "phone-wide";
export type FrameOrientation = "landscape" | "portrait";
export type FrameAspect = "3:2" | "16:9" | "4:3";

export type PhotographyPlan = {
  sensor: SensorFormat;
  focalLengthMm: number;
  orientation: FrameOrientation;
  aspect: FrameAspect;
  cameraTiltDegrees: number;
  frameVisible: boolean;
};

export const DEFAULT_PHOTOGRAPHY_PLAN: PhotographyPlan = { sensor: "full-frame", focalLengthMm: 24, orientation: "landscape", aspect: "3:2", cameraTiltDegrees: 25, frameVisible: false };

export const SENSOR_DIMENSIONS: Record<SensorFormat, { width: number; height: number }> = {
  "full-frame": { width: 36, height: 24 },
  "aps-c": { width: 23.5, height: 15.6 },
  "micro-four-thirds": { width: 17.3, height: 13 },
  "phone-wide": { width: 7.6, height: 5.7 },
};

const ASPECT_VALUES: Record<FrameAspect, number> = { "3:2": 3 / 2, "16:9": 16 / 9, "4:3": 4 / 3 };

export function photographyFieldOfView(plan: PhotographyPlan) {
  const sensor = SENSOR_DIMENSIONS[plan.sensor];
  const requestedAspect = ASPECT_VALUES[plan.aspect];
  const landscapeWidth = Math.min(sensor.width, sensor.height * requestedAspect);
  const landscapeHeight = Math.min(sensor.height, sensor.width / requestedAspect);
  const width = plan.orientation === "landscape" ? landscapeWidth : landscapeHeight;
  const height = plan.orientation === "landscape" ? landscapeHeight : landscapeWidth;
  return {
    horizontalDegrees: 2 * Math.atan(width / (2 * plan.focalLengthMm)) * 180 / Math.PI,
    verticalDegrees: 2 * Math.atan(height / (2 * plan.focalLengthMm)) * 180 / Math.PI,
    aspect: width / height,
  };
}

export function isValidPhotographyPlan(value: unknown): value is PhotographyPlan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<PhotographyPlan>;
  return !!plan.sensor && plan.sensor in SENSOR_DIMENSIONS && ["landscape", "portrait"].includes(plan.orientation ?? "") && ["3:2", "16:9", "4:3"].includes(plan.aspect ?? "") && typeof plan.focalLengthMm === "number" && plan.focalLengthMm >= 8 && plan.focalLengthMm <= 200 && typeof plan.cameraTiltDegrees === "number" && plan.cameraTiltDegrees >= -10 && plan.cameraTiltDegrees <= 90 && typeof plan.frameVisible === "boolean";
}
