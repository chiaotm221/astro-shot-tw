export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
export const SIDEREAL_DAY_SECONDS = 86164.0905;
export const SIDEREAL_RATE = TAU / SIDEREAL_DAY_SECONDS;

export function unixMillisecondsToJulianDate(timestamp: number) {
  return timestamp / 86400000 + 2440587.5;
}

export function normalizeDegrees(value: number) {
  return ((value % 360) + 360) % 360;
}

export function currentSiderealAngle(
  longitudeDegrees = 103.82,
  timestamp = Date.now(),
) {
  const julianDate = unixMillisecondsToJulianDate(timestamp);
  const degrees =
    280.46061837 +
    360.98564736629 * (julianDate - 2451545) +
    longitudeDegrees;
  return normalizeDegrees(degrees) * DEG;
}
