import type { PhotoExif } from "./exif.ts";
import type { PhotoAlignment } from "./photo-alignment.ts";
import type { PhotoPreviewSettings } from "./photo-preview.ts";
import type { PhotographyPlan } from "./photography.ts";

export type PhotographyPlanExport = {
  schema: "astro-shot/photography-plan";
  version: 1;
  exportedAt: string;
  simulationTime: string;
  site: { name: string; latitude: number; longitude: number; elevationMeters: number | null };
  camera: PhotographyPlan;
  originalExif: PhotoExif | null;
  confirmedCapture: PhotoAlignment | null;
  preview: PhotoPreviewSettings;
  limitations: string[];
};

export function buildPhotographyPlanExport(input: Omit<PhotographyPlanExport, "schema" | "version" | "exportedAt" | "limitations">, exportedAt = new Date().toISOString()): PhotographyPlanExport {
  return {
    schema: "astro-shot/photography-plan",
    version: 1,
    exportedAt,
    ...input,
    limitations: [
      "Manual photo alignment is not astrometric plate solving.",
      "Sky, Moon, Milky Way, weather, and light-pollution values may be approximate.",
      "The export does not include or embed the original photograph.",
    ],
  };
}

export function externalAiHandoffPrompt(plan: PhotographyPlanExport) {
  return [
    "Use the separately supplied photograph as the immutable foreground and composition reference.",
    "Preserve landmarks, people, buildings, terrain, perspective, crop, and camera geometry.",
    "Composite a natural night sky consistent with the confirmed capture data below.",
    "Do not invent camera metadata or claim scientific/astrometric accuracy.",
    "Avoid oversized stars, excessive saturation, repeated star patterns, and an unnaturally bright Milky Way.",
    "",
    JSON.stringify(plan, null, 2),
  ].join("\n");
}
