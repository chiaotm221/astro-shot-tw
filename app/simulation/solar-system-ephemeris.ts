import { Body, Equator, Horizon, Illumination, Observer, SearchHourAngle, SearchRiseSet } from "astronomy-engine";

export const EPHEMERIS_START_MS = Date.UTC(2020, 0, 1);
export const EPHEMERIS_END_MS = Date.UTC(2041, 0, 1) - 1;

export type SolarSystemBodyId = "moon" | "mercury" | "venus" | "mars" | "jupiter" | "saturn";

export type EphemerisObserver = {
  latitude: number;
  longitude: number;
  elevationMeters: number;
};

export type SolarSystemPosition = {
  body: SolarSystemBodyId;
  timestamp: number;
  apparentEquatorialOfDate: {
    rightAscensionRadians: number;
    declinationRadians: number;
    distanceAu: number;
  };
  topocentricHorizontalAirless: {
    azimuthDegrees: number;
    elevationDegrees: number;
  };
  illuminationFraction: number;
  visualMagnitude: number;
};

export type SolarSystemEvents = {
  body: SolarSystemBodyId;
  intervalStart: number;
  intervalEnd: number;
  rise: number | null;
  transit: number | null;
  set: number | null;
};

const ENGINE_BODY: Record<SolarSystemBodyId, Body> = {
  moon: Body.Moon,
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
};

function validateTimestamp(timestamp: number) {
  if (!Number.isFinite(timestamp) || timestamp < EPHEMERIS_START_MS || timestamp > EPHEMERIS_END_MS) {
    throw new RangeError("V7.0 ephemerides support UTC instants from 2020 through 2040");
  }
}

function engineObserver(observer: EphemerisObserver) {
  if (!Number.isFinite(observer.latitude) || observer.latitude < -90 || observer.latitude > 90) throw new RangeError("Invalid observer latitude");
  if (!Number.isFinite(observer.longitude) || observer.longitude < -180 || observer.longitude > 180) throw new RangeError("Invalid observer longitude");
  if (!Number.isFinite(observer.elevationMeters) || observer.elevationMeters < -500 || observer.elevationMeters > 10000) throw new RangeError("Invalid observer elevation");
  return new Observer(observer.latitude, observer.longitude, observer.elevationMeters);
}

export function solarSystemPosition(body: SolarSystemBodyId, timestamp: number, observer: EphemerisObserver): SolarSystemPosition {
  validateTimestamp(timestamp);
  const date = new Date(timestamp);
  const location = engineObserver(observer);
  const equatorial = Equator(ENGINE_BODY[body], date, location, true, true);
  const horizontal = Horizon(date, location, equatorial.ra, equatorial.dec);
  const illumination = Illumination(ENGINE_BODY[body], date);
  return {
    body,
    timestamp,
    apparentEquatorialOfDate: {
      rightAscensionRadians: equatorial.ra * 15 * Math.PI / 180,
      declinationRadians: equatorial.dec * Math.PI / 180,
      distanceAu: equatorial.dist,
    },
    topocentricHorizontalAirless: {
      azimuthDegrees: horizontal.azimuth,
      elevationDegrees: horizontal.altitude,
    },
    illuminationFraction: illumination.phase_fraction,
    visualMagnitude: illumination.mag,
  };
}

function eventInInterval(value: Date | null, start: number, end: number) {
  const timestamp = value?.getTime() ?? null;
  return timestamp !== null && timestamp >= start && timestamp < end ? timestamp : null;
}

export function solarSystemEvents(body: SolarSystemBodyId, intervalStart: number, intervalEnd: number, observer: EphemerisObserver): SolarSystemEvents {
  validateTimestamp(intervalStart);
  validateTimestamp(intervalEnd - 1);
  if (intervalEnd <= intervalStart || intervalEnd - intervalStart > 48 * 60 * 60 * 1000) throw new RangeError("Ephemeris event intervals must be greater than zero and at most 48 hours");
  const date = new Date(intervalStart);
  const location = engineObserver(observer);
  const limitDays = (intervalEnd - intervalStart) / 86400000;
  const rise = SearchRiseSet(ENGINE_BODY[body], location, 1, date, limitDays)?.date ?? null;
  const set = SearchRiseSet(ENGINE_BODY[body], location, -1, date, limitDays)?.date ?? null;
  const transit = SearchHourAngle(ENGINE_BODY[body], location, 0, date, 1).time.date;
  return {
    body,
    intervalStart,
    intervalEnd,
    rise: eventInInterval(rise, intervalStart, intervalEnd),
    transit: eventInInterval(transit, intervalStart, intervalEnd),
    set: eventInInterval(set, intervalStart, intervalEnd),
  };
}

export function isEphemerisTimestampSupported(timestamp: number) {
  return Number.isFinite(timestamp) && timestamp >= EPHEMERIS_START_MS && timestamp <= EPHEMERIS_END_MS;
}
