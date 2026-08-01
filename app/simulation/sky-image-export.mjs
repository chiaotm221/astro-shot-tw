export const SKY_EXPORT_SIZES = Object.freeze([
  Object.freeze({ id: "1920x1080", width: 1920, height: 1080, label: "Full HD" }),
  Object.freeze({ id: "2560x1440", width: 2560, height: 1440, label: "QHD" }),
  Object.freeze({ id: "3840x2160", width: 3840, height: 2160, label: "4K UHD" }),
]);

export function skyExportFilename(mode, transparent, timestamp, width, height) {
  const instant = new Date(timestamp).toISOString().replace(/[:.]/g, "-");
  const layer = transparent ? "transparent" : "opaque";
  return `astro-shot-${mode}-${layer}-${width}x${height}-${instant}.png`;
}

export function luminousAlpha(red, green, blue) {
  const peak = Math.max(red, green, blue);
  if (peak <= 36) return 0;
  return Math.round(Math.min(255, Math.pow((peak - 36) / 219, 0.72) * 255));
}

export function makeLuminousPixelsTransparent(pixels) {
  for (let index = 0; index < pixels.length; index += 4) {
    const alpha = luminousAlpha(pixels[index], pixels[index + 1], pixels[index + 2]);
    pixels[index + 3] = Math.min(pixels[index + 3], alpha);
  }
  return pixels;
}
