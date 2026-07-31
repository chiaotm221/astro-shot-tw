import { currentSiderealAngle, DEG, normalizeDegrees, unixMillisecondsToJulianDate } from "./astronomy-time.ts";
import { moonHorizontalCoordinates } from "./moon.ts";

export const GALACTIC_CORE = {
  rightAscension: 266.41683 * DEG,
  declination: -29.00781 * DEG,
} as const;

function horizontal(rightAscension: number, declination: number, timestamp: number, latitudeDegrees: number, longitudeDegrees: number) {
  const latitude = latitudeDegrees * DEG;
  const hourAngle = currentSiderealAngle(longitudeDegrees, timestamp) - rightAscension;
  const altitude = Math.asin(Math.sin(latitude) * Math.sin(declination) + Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle));
  const azimuth = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(latitude) - Math.tan(declination) * Math.cos(latitude));
  return { altitudeDegrees: altitude / DEG, azimuthDegrees: normalizeDegrees(azimuth / DEG + 180) };
}

export function galacticCoreHorizontal(timestamp: number, latitudeDegrees: number, longitudeDegrees: number) {
  return horizontal(GALACTIC_CORE.rightAscension, GALACTIC_CORE.declination, timestamp, latitudeDegrees, longitudeDegrees);
}

export function solarAltitude(timestamp: number, latitudeDegrees: number, longitudeDegrees: number) {
  const days = unixMillisecondsToJulianDate(timestamp) - 2451545;
  const meanLongitude = normalizeDegrees(280.46 + 0.9856474 * days);
  const anomaly = normalizeDegrees(357.528 + 0.9856003 * days);
  const longitude = normalizeDegrees(meanLongitude + 1.915 * Math.sin(anomaly * DEG) + 0.02 * Math.sin(2 * anomaly * DEG)) * DEG;
  const obliquity = (23.439 - 0.0000004 * days) * DEG;
  const rightAscension = Math.atan2(Math.cos(obliquity) * Math.sin(longitude), Math.cos(longitude));
  const declination = Math.asin(Math.sin(obliquity) * Math.sin(longitude));
  return horizontal(rightAscension, declination, timestamp, latitudeDegrees, longitudeDegrees).altitudeDegrees;
}

type Crossing = { time: number; rising: boolean };

function crossings(timestamp: number, hours: number, stepMinutes: number, valueAt: (time: number) => number, threshold: number) {
  const step = stepMinutes * 60000;
  const results: Crossing[] = [];
  let previousTime = timestamp;
  let previous = valueAt(timestamp) - threshold;
  for (let time = timestamp + step; time <= timestamp + hours * 3600000; time += step) {
    const current = valueAt(time) - threshold;
    if ((previous < 0 && current >= 0) || (previous >= 0 && current < 0)) {
      const fraction = Math.abs(previous) / (Math.abs(previous) + Math.abs(current));
      results.push({ time: previousTime + step * fraction, rising: current >= 0 });
    }
    previousTime = time;
    previous = current;
  }
  return results;
}

export function planMilkyWay(timestamp: number, latitudeDegrees: number, longitudeDegrees: number) {
  const coreNow = galacticCoreHorizontal(timestamp, latitudeDegrees, longitudeDegrees);
  const coreCrossings = crossings(timestamp, 24, 10, (time) => galacticCoreHorizontal(time, latitudeDegrees, longitudeDegrees).altitudeDegrees, 0);
  const twilightCrossings = crossings(timestamp, 24, 10, (time) => solarAltitude(time, latitudeDegrees, longitudeDegrees), -18);
  const samples = [] as { time: number; score: number; altitude: number; azimuth: number }[];
  for (let time = timestamp; time <= timestamp + 24 * 3600000; time += 10 * 60000) {
    const core = galacticCoreHorizontal(time, latitudeDegrees, longitudeDegrees);
    const sun = solarAltitude(time, latitudeDegrees, longitudeDegrees);
    if (core.altitudeDegrees < 10 || sun > -18) continue;
    const moon = moonHorizontalCoordinates(time, latitudeDegrees, longitudeDegrees);
    const moonPenalty = moon.altitudeDegrees > 0 ? moon.moon.illuminatedFraction * 35 : 0;
    samples.push({ time, altitude: core.altitudeDegrees, azimuth: core.azimuthDegrees, score: core.altitudeDegrees - moonPenalty });
  }
  const best = samples.reduce<(typeof samples)[number] | null>((winner, sample) => !winner || sample.score > winner.score ? sample : winner, null);
  let windowStart: number | null = null;
  let windowEnd: number | null = null;
  if (best) {
    const acceptable = best.score - 12;
    const index = samples.indexOf(best);
    let startIndex = index;
    let endIndex = index;
    while (startIndex > 0 && samples[startIndex - 1].time === samples[startIndex].time - 600000 && samples[startIndex - 1].score >= acceptable) startIndex--;
    while (endIndex < samples.length - 1 && samples[endIndex + 1].time === samples[endIndex].time + 600000 && samples[endIndex + 1].score >= acceptable) endIndex++;
    windowStart = samples[startIndex].time;
    windowEnd = samples[endIndex].time + 600000;
  }
  return {
    coreNow,
    rise: coreCrossings.find((entry) => entry.rising)?.time ?? null,
    set: coreCrossings.find((entry) => !entry.rising)?.time ?? null,
    astronomicalNightStarts: twilightCrossings.find((entry) => !entry.rising)?.time ?? null,
    astronomicalNightEnds: twilightCrossings.find((entry) => entry.rising)?.time ?? null,
    best,
    windowStart,
    windowEnd,
  };
}
