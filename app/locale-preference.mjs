export function resolveInitialLocale(storedLocale, defaultLocale) {
  if (storedLocale === "zh-CN") return "zh-TW";
  if (storedLocale === "zh-TW" || storedLocale === "en") {
    return storedLocale;
  }
  return defaultLocale === "zh-TW" || defaultLocale === "zh-CN"
    ? "zh-TW"
    : "en";
}
