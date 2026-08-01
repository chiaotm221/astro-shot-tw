const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const configuredDefaultLocale = process.env.NEXT_PUBLIC_DEFAULT_LOCALE;

export const defaultLocale =
  configuredDefaultLocale === "zh-TW" || configuredDefaultLocale === "zh-CN"
    ? "zh-TW"
    : "en";

export function withBasePath(path: `/${string}`): string {
  return `${basePath}${path}`;
}
