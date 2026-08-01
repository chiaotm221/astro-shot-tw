import type { PhotoExif } from "./exif.ts";

export type PhotoAlignment = {
  capturedAt: string;
  capturedAtOffset: string | null;
  latitude: number | null;
  longitude: number | null;
  elevationMeters: number | null;
  focalLengthMm: number | null;
  orientation: number;
  azimuthDegrees: number;
  tiltDegrees: number;
  opacity: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

export const DEFAULT_PHOTO_ALIGNMENT: PhotoAlignment = {
  capturedAt: "", capturedAtOffset: null, latitude: null, longitude: null, elevationMeters: null,
  focalLengthMm: null, orientation: 1, azimuthDegrees: 180, tiltDegrees: 25,
  opacity: 0.62, scale: 1, offsetX: 0, offsetY: 0,
};

export function alignmentFromExif(exif: PhotoExif): PhotoAlignment {
  return {
    ...DEFAULT_PHOTO_ALIGNMENT,
    capturedAt: exif.capturedAt ? exif.capturedAt.replace(/^(\d{4}):(\d{2}):(\d{2}) /, "$1-$2-$3T") : "",
    capturedAtOffset: exif.capturedAtOffset,
    latitude: exif.latitude,
    longitude: exif.longitude,
    elevationMeters: exif.altitudeMeters,
    focalLengthMm: exif.focalLengthMm ?? exif.focalLength35Mm,
    orientation: exif.orientation ?? 1,
    azimuthDegrees: exif.headingDegrees ?? DEFAULT_PHOTO_ALIGNMENT.azimuthDegrees,
  };
}

export function captureTimestampFromAlignment(alignment: Pick<PhotoAlignment, "capturedAt" | "capturedAtOffset">) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(alignment.capturedAt)) return null;
  const timestamp = Date.parse(`${alignment.capturedAt}${alignment.capturedAtOffset ?? ""}`);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function exifFieldMatches<Key extends "capturedAt" | "latitude" | "longitude" | "elevationMeters" | "focalLengthMm" | "orientation" | "azimuthDegrees">(alignment: PhotoAlignment, exif: PhotoExif, key: Key) {
  const sources = {
    capturedAt: exif.capturedAt ? exif.capturedAt.replace(/^(\d{4}):(\d{2}):(\d{2}) /, "$1-$2-$3T") : null,
    latitude: exif.latitude,
    longitude: exif.longitude,
    elevationMeters: exif.altitudeMeters,
    focalLengthMm: exif.focalLengthMm ?? exif.focalLength35Mm,
    orientation: exif.orientation,
    azimuthDegrees: exif.headingDegrees,
  };
  const source = sources[key];
  return source !== null && source !== "" && alignment[key] === source;
}
