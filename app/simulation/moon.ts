import { currentSiderealAngle, DEG, normalizeDegrees, unixMillisecondsToJulianDate } from "./astronomy-time.ts";

const SYNODIC_MONTH_DAYS = 29.530588853;

export type MoonPosition = {
  rightAscension: number;
  declination: number;
  eclipticLongitudeDegrees: number;
  phaseAngleDegrees: number;
  illuminatedFraction: number;
  ageDays: number;
  waxing: boolean;
};

const sine = (degrees: number) => Math.sin(degrees * DEG);

export function calculateMoonPosition(timestamp: number): MoonPosition {
  const days = unixMillisecondsToJulianDate(timestamp) - 2451545;
  const meanSolarLongitude = normalizeDegrees(280.46 + 0.9856474 * days);
  const solarAnomaly = normalizeDegrees(357.528 + 0.9856003 * days);
  const solarLongitude = normalizeDegrees(meanSolarLongitude + 1.915 * sine(solarAnomaly) + 0.02 * sine(2 * solarAnomaly));
  const meanLunarLongitude = normalizeDegrees(218.316 + 13.176396 * days);
  const lunarAnomaly = normalizeDegrees(134.963 + 13.064993 * days);
  const lunarArgument = normalizeDegrees(93.272 + 13.22935 * days);
  const longitude = normalizeDegrees(meanLunarLongitude + 6.289 * sine(lunarAnomaly));
  const latitude = 5.128 * sine(lunarArgument);
  const obliquity = (23.439 - 0.0000004 * days) * DEG;
  const longitudeRadians = longitude * DEG;
  const latitudeRadians = latitude * DEG;
  const equatorialX = Math.cos(longitudeRadians) * Math.cos(latitudeRadians);
  const equatorialY = Math.sin(longitudeRadians) * Math.cos(latitudeRadians) * Math.cos(obliquity) - Math.sin(latitudeRadians) * Math.sin(obliquity);
  const equatorialZ = Math.sin(longitudeRadians) * Math.cos(latitudeRadians) * Math.sin(obliquity) + Math.sin(latitudeRadians) * Math.cos(obliquity);
  const phaseAngleDegrees = normalizeDegrees(longitude - solarLongitude);
  return {
    rightAscension: Math.atan2(equatorialY, equatorialX),
    declination: Math.asin(equatorialZ),
    eclipticLongitudeDegrees: longitude,
    phaseAngleDegrees,
    illuminatedFraction: (1 - Math.cos(phaseAngleDegrees * DEG)) / 2,
    ageDays: phaseAngleDegrees / 360 * SYNODIC_MONTH_DAYS,
    waxing: phaseAngleDegrees < 180,
  };
}

export function moonHorizontalCoordinates(timestamp: number, latitudeDegrees: number, longitudeDegrees: number) {
  const moon = calculateMoonPosition(timestamp);
  const sidereal = currentSiderealAngle(longitudeDegrees, timestamp);
  const hourAngle = sidereal - moon.rightAscension;
  const latitude = latitudeDegrees * DEG;
  const altitude = Math.asin(Math.sin(latitude) * Math.sin(moon.declination) + Math.cos(latitude) * Math.cos(moon.declination) * Math.cos(hourAngle));
  const azimuth = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(latitude) - Math.tan(moon.declination) * Math.cos(latitude));
  return { moon, altitudeDegrees: altitude / DEG, azimuthDegrees: normalizeDegrees(azimuth / DEG + 180) };
}

export function findMoonRiseAndSet(timestamp: number, latitudeDegrees: number, longitudeDegrees: number) {
  const step = 10 * 60 * 1000;
  const end = timestamp + 24 * 60 * 60 * 1000;
  let previousTime = timestamp;
  let previousAltitude = moonHorizontalCoordinates(previousTime, latitudeDegrees, longitudeDegrees).altitudeDegrees;
  let rise: number | null = null;
  let set: number | null = null;
  for (let sampleTime = timestamp + step; sampleTime <= end && (rise === null || set === null); sampleTime += step) {
    const altitude = moonHorizontalCoordinates(sampleTime, latitudeDegrees, longitudeDegrees).altitudeDegrees;
    if ((previousAltitude < 0 && altitude >= 0) || (previousAltitude >= 0 && altitude < 0)) {
      const fraction = Math.abs(previousAltitude) / (Math.abs(previousAltitude) + Math.abs(altitude));
      const crossing = previousTime + step * fraction;
      if (altitude >= 0 && rise === null) rise = crossing;
      if (altitude < 0 && set === null) set = crossing;
    }
    previousTime = sampleTime;
    previousAltitude = altitude;
  }
  return { rise, set };
}

export function moonPhaseKey(ageDays: number) {
  if (ageDays < 1.85 || ageDays >= 27.68) return "new";
  if (ageDays < 5.54) return "waxing-crescent";
  if (ageDays < 9.23) return "first-quarter";
  if (ageDays < 12.92) return "waxing-gibbous";
  if (ageDays < 16.61) return "full";
  if (ageDays < 20.3) return "waning-gibbous";
  if (ageDays < 23.99) return "last-quarter";
  return "waning-crescent";
}
