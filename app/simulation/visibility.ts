import { DEG, SIDEREAL_RATE, TAU } from "./astronomy-time.ts";
import type { CelestialObject } from "./celestial-objects.ts";

export type VisibilityStatus = "visible" | "low" | "later" | "not-tonight";

export type ObjectVisibility = {
  object: CelestialObject;
  altitudeDegrees: number;
  azimuthDegrees: number;
  status: VisibilityStatus;
  risesInHours: number | null;
  score: number;
};

export function horizontalCoordinates(
  object: Pick<CelestialObject, "rightAscension" | "declination">,
  latitudeDegrees: number,
  siderealAngle: number,
) {
  const latitude = latitudeDegrees * DEG;
  const sinLatitude = Math.sin(latitude);
  const cosLatitude = Math.cos(latitude);
  const cosDeclination = Math.cos(object.declination);
  const equatorialX = cosDeclination * Math.cos(object.rightAscension);
  const equatorialY = cosDeclination * Math.sin(object.rightAscension);
  const equatorialZ = Math.sin(object.declination);
  const sinSidereal = Math.sin(siderealAngle);
  const cosSidereal = Math.cos(siderealAngle);
  const hourCosine =
    equatorialX * cosSidereal + equatorialY * sinSidereal;
  const localX =
    equatorialY * cosSidereal - equatorialX * sinSidereal;
  const localY =
    equatorialZ * cosLatitude - hourCosine * sinLatitude;
  const localZ =
    equatorialZ * sinLatitude + hourCosine * cosLatitude;
  return {
    altitudeDegrees: Math.asin(Math.max(-1, Math.min(1, localZ))) / DEG,
    azimuthDegrees: ((Math.atan2(localX, localY) / DEG) % 360 + 360) % 360,
  };
}

function hoursUntilAboveHorizon(
  object: CelestialObject,
  latitudeDegrees: number,
  siderealAngle: number,
) {
  const sampleMinutes = 15;
  const maximumMinutes = 12 * 60;
  for (let minutes = sampleMinutes; minutes <= maximumMinutes; minutes += sampleMinutes) {
    const futureSidereal =
      (siderealAngle + SIDEREAL_RATE * minutes * 60) % TAU;
    if (
      horizontalCoordinates(object, latitudeDegrees, futureSidereal)
        .altitudeDegrees >= 10
    ) {
      return minutes / 60;
    }
  }
  return null;
}

export function calculateVisibility(
  object: CelestialObject,
  latitudeDegrees: number,
  siderealAngle: number,
): ObjectVisibility {
  const coordinates = horizontalCoordinates(
    object,
    latitudeDegrees,
    siderealAngle,
  );
  let status: VisibilityStatus;
  let risesInHours: number | null = null;
  if (coordinates.altitudeDegrees >= 10) status = "visible";
  else if (coordinates.altitudeDegrees >= 0) status = "low";
  else {
    risesInHours = hoursUntilAboveHorizon(
      object,
      latitudeDegrees,
      siderealAngle,
    );
    status = risesInHours === null ? "not-tonight" : "later";
  }
  const statusWeight =
    status === "visible" ? 100 : status === "low" ? 55 : status === "later" ? 25 : 0;
  return {
    object,
    ...coordinates,
    status,
    risesInHours,
    score:
      statusWeight +
      Math.max(-10, Math.min(70, coordinates.altitudeDegrees)) -
      object.magnitude * 4,
  };
}

export function recommendTonight(
  objects: readonly CelestialObject[],
  latitudeDegrees: number,
  siderealAngle: number,
  limit = 5,
) {
  return objects
    .map((object) => calculateVisibility(object, latitudeDegrees, siderealAngle))
    .filter((entry) => entry.status !== "not-tonight")
    .sort((first, second) => second.score - first.score)
    .slice(0, limit);
}
