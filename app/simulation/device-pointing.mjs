const DEG = Math.PI / 180;

export function normalizeHeadingDegrees(value) {
  return ((value % 360) + 360) % 360;
}

export function orientationToView(alphaDegrees, betaDegrees, gammaDegrees) {
  if (![alphaDegrees, betaDegrees, gammaDegrees].every(Number.isFinite)) return null;
  const alpha = alphaDegrees * DEG;
  const beta = betaDegrees * DEG;
  const gamma = gammaDegrees * DEG;

  // Rotate the back-camera direction (device -Z) using the specification's
  // intrinsic Z-X'-Y'' orientation. Because the camera is on the Z axis, this
  // direction is invariant under portrait/landscape screen rotation.
  const east = -Math.cos(alpha) * Math.sin(gamma) - Math.sin(alpha) * Math.sin(beta) * Math.cos(gamma);
  const north = -Math.sin(alpha) * Math.sin(gamma) + Math.cos(alpha) * Math.sin(beta) * Math.cos(gamma);
  const up = -Math.cos(beta) * Math.cos(gamma);
  const horizontalLength = Math.hypot(east, north);
  const azimuthDegrees = horizontalLength < 1e-5
    ? normalizeHeadingDegrees(360 - alphaDegrees)
    : normalizeHeadingDegrees(Math.atan2(east, north) / DEG);
  return {
    azimuthDegrees,
    altitudeDegrees: Math.asin(Math.max(-1, Math.min(1, up))) / DEG,
  };
}

export function circularLerpDegrees(fromDegrees, toDegrees, amount) {
  const delta = ((toDegrees - fromDegrees + 540) % 360) - 180;
  return normalizeHeadingDegrees(fromDegrees + delta * Math.max(0, Math.min(1, amount)));
}

export function linearLerp(from, to, amount) {
  return from + (to - from) * Math.max(0, Math.min(1, amount));
}
