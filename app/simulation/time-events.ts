import { solarAltitude } from "./milky-way.ts";

export function startOfLocalDay(timestamp: number) {
  const date = new Date(timestamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function crossings(dayStart: number, latitude: number, longitude: number, threshold: number) {
  const step = 5 * 60 * 1000;
  const results: { time: number; rising: boolean }[] = [];
  let previousTime = dayStart;
  let previous = solarAltitude(previousTime, latitude, longitude) - threshold;
  for (let time = dayStart + step; time <= dayStart + 36 * 60 * 60 * 1000; time += step) {
    const current = solarAltitude(time, latitude, longitude) - threshold;
    if ((previous < 0 && current >= 0) || (previous >= 0 && current < 0)) {
      const fraction = Math.abs(previous) / (Math.abs(previous) + Math.abs(current));
      results.push({ time: previousTime + step * fraction, rising: current >= 0 });
    }
    previousTime = time;
    previous = current;
  }
  return results;
}

export function solarEventsForLocalDay(dayStart: number, latitude: number, longitude: number) {
  const horizon = crossings(dayStart, latitude, longitude, -0.833);
  const astronomical = crossings(dayStart, latitude, longitude, -18);
  const sunset = horizon.find((event) => !event.rising)?.time ?? null;
  const astronomicalDusk = astronomical.find((event) => !event.rising)?.time ?? null;
  return {
    sunrise: horizon.find((event) => event.rising && (sunset === null || event.time > sunset))?.time ?? null,
    sunset,
    astronomicalDusk,
    astronomicalDawn: astronomical.find((event) => event.rising && (astronomicalDusk === null || event.time > astronomicalDusk))?.time ?? null,
    midnight: dayStart + 24 * 60 * 60 * 1000,
  };
}

export function localDateInputValue(timestamp: number) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}
