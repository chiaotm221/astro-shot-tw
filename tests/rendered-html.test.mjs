import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { computeGlassScissorBounds } from "../app/liquid-glass-geometry.mjs";
import {
  pinchRatio,
  pointerDistance,
} from "../app/pinch-gesture.mjs";
import { createOpeningFireballCue } from "../app/opening-fireball.mjs";
import { resolveInitialLocale } from "../app/locale-preference.mjs";
import {
  isValidLatitude,
  isValidLongitude,
} from "../app/simulation/observing-sites.ts";
import {
  calculateVisibility,
  horizontalCoordinates,
  recommendTonight,
} from "../app/simulation/visibility.ts";
import {
  firstStarAtOrBelowMagnitude,
  projectCelestial,
  setEquatorialCoordinates,
  setSensorNoiseCrop,
} from "../app/rendering-helpers.mjs";
import {
  createObjectSearchIndex,
  normalizeSearchTerm,
  searchCelestialObjects,
} from "../app/simulation/object-search.ts";
import { CELESTIAL_OBJECTS } from "../app/simulation/celestial-objects.ts";
import {
  calculateMoonPosition,
  findMoonRiseAndSet,
  moonPhaseKey,
} from "../app/simulation/moon.ts";
import {
  galacticCoreHorizontal,
  planMilkyWay,
  solarAltitude,
} from "../app/simulation/milky-way.ts";
import {
  solarEventsForLocalDay,
  startOfLocalDay,
} from "../app/simulation/time-events.ts";
import { OBSERVING_SITE_DETAILS } from "../app/simulation/observing-site-details.ts";
import { OBSERVING_SITES } from "../app/simulation/observing-sites.ts";
import {
  observingConditionScore,
  parseOpenMeteoWeather,
  weatherApiUrl,
} from "../app/simulation/weather.ts";
import {
  combinedDarknessScore,
  LIGHT_POLLUTION_PROFILES,
} from "../app/simulation/light-pollution.ts";
import {
  DEFAULT_PHOTOGRAPHY_PLAN,
  isValidPhotographyPlan,
  photographyFieldOfView,
} from "../app/simulation/photography.ts";
import { hasExifData, readJpegExif } from "../app/simulation/exif.ts";
import {
  alignmentFromExif,
  exifFieldMatches,
} from "../app/simulation/photo-alignment.ts";
import { trailSampleIntervalSeconds } from "../app/simulation/photo-preview.ts";
import {
  buildPhotographyPlanShareUrl,
  buildPhotographyPlanExport,
  externalAiHandoffPrompt,
  parsePhotographyPlanShareUrl,
  printablePhotographyPlanHtml,
} from "../app/simulation/plan-export.ts";

test("object search normalizes aliases and localized names", () => {
  const index = createObjectSearchIndex(CELESTIAL_OBJECTS);
  assert.equal(normalizeSearchTerm("Orion-Nebula"), "orionnebula");
  assert.equal(searchCelestialObjects("天狼", 8, index)[0]?.id, "sirius");
  assert.equal(searchCelestialObjects("m 42", 8, index)[0]?.id, "orion-nebula");
  assert.equal(searchCelestialObjects("BIG-DIPPER", 8, index)[0]?.id, "ursa-major");
});

test("moon calculations preserve phase and event invariants", () => {
  const knownNewMoon = Date.UTC(2024, 3, 8, 18, 21);
  const moon = calculateMoonPosition(knownNewMoon);
  assert.ok(moon.illuminatedFraction < 0.08);
  assert.equal(moonPhaseKey(moon.ageDays), "new");
  const events = findMoonRiseAndSet(knownNewMoon, 23.5, 121);
  assert.ok(events.rise === null || events.rise > knownNewMoon);
  assert.ok(events.set === null || events.set > knownNewMoon);
});

test("Milky Way planner returns bounded coordinates and planning windows", () => {
  const timestamp = Date.UTC(2026, 6, 15, 16, 0);
  const core = galacticCoreHorizontal(timestamp, 23.5, 121);
  assert.ok(core.azimuthDegrees >= 0 && core.azimuthDegrees < 360);
  assert.ok(core.altitudeDegrees >= -90 && core.altitudeDegrees <= 90);
  assert.ok(solarAltitude(timestamp, 23.5, 121) < 0);
  const plan = planMilkyWay(timestamp, 23.5, 121);
  assert.ok(plan.windowStart === null || plan.windowEnd > plan.windowStart);
  assert.ok(plan.best === null || plan.best.altitude >= 10);
});

test("overnight timeline orders sunset, midnight, and following sunrise", () => {
  const dayStart = startOfLocalDay(new Date(2026, 6, 15, 12).getTime());
  const events = solarEventsForLocalDay(dayStart, 23.5, 121);
  assert.ok(events.sunset !== null);
  assert.ok(events.astronomicalDusk !== null);
  assert.ok(events.sunrise !== null);
  assert.ok(events.sunset < events.astronomicalDusk);
  assert.ok(events.astronomicalDusk < events.midnight);
  assert.ok(events.midnight < events.sunrise);
});

test("bundled Taiwan observing sites have complete static planning details", () => {
  for (const site of OBSERVING_SITES) {
    const details = OBSERVING_SITE_DETAILS[site.id];
    assert.ok(details, `missing details for ${site.id}`);
    assert.ok(details.lightPollution.en.length > 0);
    assert.ok(details.horizon["zh-TW"].length > 0);
    assert.ok(site.elevationMeters >= 0);
  }
});

test("weather responses normalize into a bounded observing score", () => {
  const weather = parseOpenMeteoWeather({
    current: { time: "2026-08-01T20:00", temperature_2m: 22, relative_humidity_2m: 70, precipitation: 0, cloud_cover: 12, wind_speed_10m: 7 },
    hourly: { time: ["2026-08-01T20:00"], precipitation_probability: [5], visibility: [24000] },
  }, 1234);
  assert.equal(weather.fetchedAt, 1234);
  assert.ok(observingConditionScore(weather) >= 75);
  const url = weatherApiUrl(23.5, 121);
  assert.match(url, /api\.open-meteo\.com/);
  assert.match(url, /cloud_cover/);
});

test("light-pollution profiles cover bundled sites and moonlight cannot improve them", () => {
  for (const site of OBSERVING_SITES) {
    const profile = LIGHT_POLLUTION_PROFILES[site.id];
    assert.ok(profile, `missing light-pollution profile for ${site.id}`);
    assert.ok(profile.baseDarknessScore >= 0 && profile.baseDarknessScore <= 100);
    assert.ok(combinedDarknessScore(profile, 1, 60) <= profile.baseDarknessScore);
    assert.ok(profile.estimatedVisibleStars[1] >= profile.estimatedVisibleStars[0]);
  }
});

test("camera geometry narrows with focal length and swaps on portrait orientation", () => {
  const wide = photographyFieldOfView(DEFAULT_PHOTOGRAPHY_PLAN);
  const telephoto = photographyFieldOfView({ ...DEFAULT_PHOTOGRAPHY_PLAN, focalLengthMm: 50 });
  const portrait = photographyFieldOfView({ ...DEFAULT_PHOTOGRAPHY_PLAN, orientation: "portrait" });
  assert.ok(telephoto.horizontalDegrees < wide.horizontalDegrees);
  assert.ok(Math.abs(portrait.horizontalDegrees - wide.verticalDegrees) < 1e-9);
  assert.ok(isValidPhotographyPlan(DEFAULT_PHOTOGRAPHY_PLAN));
});

test("local JPEG EXIF parser reads a bounded little-endian orientation tag", () => {
  const bytes = new Uint8Array(40);
  const view = new DataView(bytes.buffer);
  view.setUint16(0, 0xffd8);
  view.setUint16(2, 0xffe1);
  view.setUint16(4, 34);
  bytes.set([0x45, 0x78, 0x69, 0x66, 0, 0], 6);
  bytes.set([0x49, 0x49], 12);
  view.setUint16(14, 42, true);
  view.setUint32(16, 8, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 0x0112, true);
  view.setUint16(24, 3, true);
  view.setUint32(26, 1, true);
  view.setUint16(30, 6, true);
  view.setUint32(34, 0, true);
  view.setUint16(38, 0xffd9);
  const exif = readJpegExif(bytes.buffer);
  assert.equal(exif.orientation, 6);
  assert.ok(hasExifData(exif));
});

test("photo alignment preserves EXIF provenance after manual correction", () => {
  const exif = { make: null, model: null, orientation: 6, capturedAt: "2026:07:15 21:30:00", focalLengthMm: 24, focalLength35Mm: null, latitude: 23.5, longitude: 121, altitudeMeters: 1000 };
  const alignment = alignmentFromExif(exif);
  assert.equal(alignment.capturedAt, "2026-07-15T21:30:00");
  assert.ok(exifFieldMatches(alignment, exif, "latitude"));
  assert.ok(!exifFieldMatches({ ...alignment, latitude: 23.6 }, exif, "latitude"));
});

test("star-trail sampling stays bounded as preview duration changes", () => {
  assert.equal(trailSampleIntervalSeconds(5), 2.5);
  assert.equal(trailSampleIntervalSeconds(30), 15);
  assert.ok(trailSampleIntervalSeconds(120) > trailSampleIntervalSeconds(30));
});

test("photography-plan export is versioned and excludes image payloads", () => {
  const plan = buildPhotographyPlanExport({
    simulationTime: "2026-07-15T12:00:00.000Z",
    site: { name: "Test", latitude: 23.5, longitude: 121, elevationMeters: 1000 },
    camera: DEFAULT_PHOTOGRAPHY_PLAN,
    originalExif: null,
    confirmedCapture: null,
    preview: { enabled: true, mode: "stars", opacity: 0.7, trailMinutes: 30 },
  }, "2026-01-01T00:00:00.000Z");
  assert.equal(plan.schema, "astro-shot/photography-plan");
  assert.equal(plan.version, 1);
  assert.doesNotMatch(JSON.stringify(plan), /data:image|blob:/);
  assert.match(externalAiHandoffPrompt(plan), /immutable foreground/);

  plan.originalExif = { make: "Private camera" };
  plan.confirmedCapture = { latitude: 1, longitude: 2 };
  const shareUrl = buildPhotographyPlanShareUrl(plan, "https://example.test/astro-shot/");
  const shared = parsePhotographyPlanShareUrl(shareUrl);
  assert.equal(shared?.site.name, "Test");
  assert.equal(shared?.originalExif, null);
  assert.equal(shared?.confirmedCapture, null);
  assert.ok(shareUrl.startsWith("https://example.test/astro-shot/#plan="));
  assert.throws(() => parsePhotographyPlanShareUrl("https://example.test/#plan=eyJzY2hlbWEiOiJiYWQifQ"), /Unsupported/);

  const printable = printablePhotographyPlanHtml({ ...plan, site: { ...plan.site, name: "<script>alert(1)</script>" } }, "en");
  assert.match(printable, /Print|photography plan/i);
  assert.doesNotMatch(printable, /<script>alert\(1\)<\/script>/);
  assert.match(printable, /&lt;script&gt;/);
});

async function render() {
  return readFile(new URL("../out/index.html", import.meta.url), "utf8");
}

async function readBuiltStyles(html, basePath) {
  const stylesheetUrls = [
    ...html.matchAll(/<link[^>]+href="([^"]+\.css)"[^>]*>/g),
  ].map((match) => match[1]);
  const styles = await Promise.all(
    stylesheetUrls.map((stylesheetUrl) => {
      const pathname = new URL(
        stylesheetUrl,
        "https://astroshot.test",
      ).pathname;
      const unprefixed =
        basePath && pathname.startsWith(`${basePath}/`)
          ? pathname.slice(basePath.length)
          : pathname;
      const relativePath = decodeURIComponent(unprefixed).replace(/^\/+/, "");
      return readFile(
        new URL(`../out/${relativePath}`, import.meta.url),
        "utf8",
      );
    }),
  );
  return styles.join("\n");
}

test("static export includes installable and offline PWA assets", async () => {
  const html = await render();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const manifest = JSON.parse(await readFile(
    new URL("../out/manifest.webmanifest", import.meta.url),
    "utf8",
  ));
  const serviceWorker = await readFile(
    new URL("../out/sw.js", import.meta.url),
    "utf8",
  );

  assert.ok(html.includes(`href="${basePath}/manifest.webmanifest"`));
  assert.equal(manifest.start_url, `${basePath}/`);
  assert.equal(manifest.scope, `${basePath}/`);
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
  assert.match(serviceWorker, /data\/stars\.json/);
  assert.match(serviceWorker, /request\.mode === "navigate"/);
  assert.match(serviceWorker, /caches\.match/);
  assert.match(serviceWorker, /CACHE_OFFLINE/);
  assert.match(serviceWorker, /SKIP_WAITING/);
  assert.match(serviceWorker, /astroshot-v6\.1/);
  assert.match(serviceWorker, /__offline-ready__/);
  assert.match(serviceWorker, /html\.matchAll/);
  assert.match(serviceWorker, /(?:src\|href)/);
  assert.doesNotMatch(serviceWorker, /install[\s\S]{0,350}self\.skipWaiting\(\)/);
});

test("static export renders the AstroShot shell and controls", async () => {
  const html = await render();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const builtStyles = await readBuiltStyles(html, basePath);
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"
  ).replace(/\/$/, "");

  assert.match(html, /<html lang="en">/i);
  assert.match(html, /<title>AstroShot · Real Sky &amp; Meteor Simulator<\/title>/i);
  assert.match(html, new RegExp(`(?:href|src)="${basePath}/_next/static/`));
  assert.ok(html.includes(`content="${siteUrl}/og.png"`));
  if (basePath) {
    assert.ok(!html.includes(`${basePath}${basePath}/og.png`));
  }
  assert.match(html, /aria-label="Draggable real-sky simulation canvas"/);
  assert.match(html, /HYG v4\.1 · HIPPARCOS \/ YALE \/ GLIESE/);
  assert.match(html, /aria-label="Atmospheric twinkle"/);
  assert.match(html, /aria-label="Base speed"/);
  assert.match(html, /aria-label="Ordinary meteor and fireball ratio"/);
  assert.match(html, /aria-valuetext="Ordinary 74%, Fireball 26%"/);
  assert.match(html, /aria-label="Ignition time"/);
  assert.match(html, /aria-label="Flare probability"/);
  assert.match(html, /aria-label="Flare position"/);
  assert.match(html, /aria-label="Direction spread"/);
  assert.match(html, /Trigger ordinary meteor/);
  assert.match(html, /Trigger weak fireball/);
  assert.match(html, /Trigger strong fireball/);
  assert.match(html, /Simulate high-ISO sensor grain/);
  assert.match(html, /aria-label="Open settings"/);
  assert.match(html, /aria-label="Enter camera mode"/);
  assert.match(html, />Long exposure</);
  assert.match(html, /aria-expanded="false"/);
  assert.match(html, /aria-label="Switch to Chinese"/);
  assert.doesNotMatch(html, /github-link|github\.com\/CatsJuice\/astro-shot/);
  assert.match(html, /Add custom location/);
  assert.match(html, /Offline Data &amp; Updates/);
  assert.match(html, /Download incomplete/);
  assert.match(html, /Download offline data/);
  assert.match(html, /Remove offline data/);
  assert.match(html, /Print \/ Save PDF/);
  assert.match(html, /Share or copy link/);
  assert.match(html, /Use current location/);
  assert.match(html, /Tonight(?:'|&#x27;)s Sky/);
  assert.doesNotMatch(html, />LIVE</);
  assert.doesNotMatch(html, /夜航|NIGHTFALL|拖拽观察天穹| FPS/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
  assert.doesNotMatch(
    `${html}\n${builtStyles}`,
    /Geist Mono|geist_mono|font-geist-mono/i,
  );

  await access(new URL("../out/.nojekyll", import.meta.url));
});

test("optimized star projection matches the reference coordinate system", () => {
  const width = 1920;
  const height = 1080;
  const focal = 960;
  const actual = { x: 0, y: 0, altitude: 0, depth: 0 };
  const star = {
    equatorialX: 0,
    equatorialY: 0,
    equatorialZ: 0,
  };
  const views = [
    [0, 0],
    [2.2, 0.4],
    [5.8, -0.1],
  ];

  for (const rightAscension of [0, 0.7, 2.5, 5.9]) {
    for (const declination of [-1.1, -0.2, 0.8]) {
      setEquatorialCoordinates(star, rightAscension, declination);
      for (const sidereal of [0, 0.9, 4.8]) {
        for (const latitude of [-1, 0, 0.9]) {
          for (const [azimuth, altitude] of views) {
            const sinAzimuth = Math.sin(azimuth);
            const cosAzimuth = Math.cos(azimuth);
            const sinAltitude = Math.sin(altitude);
            const cosAltitude = Math.cos(altitude);
            const basis = {
              forward: [
                sinAzimuth * cosAltitude,
                cosAzimuth * cosAltitude,
                sinAltitude,
              ],
              right: [cosAzimuth, -sinAzimuth, 0],
              up: [
                -sinAzimuth * sinAltitude,
                -cosAzimuth * sinAltitude,
                cosAltitude,
              ],
            };

            const hourAngle = sidereal - rightAscension;
            const sinDeclination = Math.sin(declination);
            const cosDeclination = Math.cos(declination);
            const referenceLocal = [
              -cosDeclination * Math.sin(hourAngle),
              sinDeclination * Math.cos(latitude) -
                cosDeclination * Math.cos(hourAngle) * Math.sin(latitude),
              sinDeclination * Math.sin(latitude) +
                cosDeclination * Math.cos(hourAngle) * Math.cos(latitude),
            ];
            const referenceCameraX =
              referenceLocal[0] * basis.right[0] +
              referenceLocal[1] * basis.right[1] +
              referenceLocal[2] * basis.right[2];
            const referenceCameraY =
              referenceLocal[0] * basis.up[0] +
              referenceLocal[1] * basis.up[1] +
              referenceLocal[2] * basis.up[2];
            const referenceCameraZ =
              referenceLocal[0] * basis.forward[0] +
              referenceLocal[1] * basis.forward[1] +
              referenceLocal[2] * basis.forward[2];
            const referenceVisible = referenceCameraZ > 0.08;

            const visible = projectCelestial(
              star,
              Math.sin(sidereal),
              Math.cos(sidereal),
              Math.sin(latitude),
              Math.cos(latitude),
              basis,
              focal,
              width,
              height,
              actual,
            );
            assert.equal(visible, referenceVisible);
            if (!referenceVisible) continue;

            const expected = {
              x: width * 0.5 + (referenceCameraX / referenceCameraZ) * focal,
              y: height * 0.5 - (referenceCameraY / referenceCameraZ) * focal,
              altitude: referenceLocal[2],
              depth: referenceCameraZ,
            };
            for (const key of ["x", "y", "altitude", "depth"]) {
              assert.ok(
                Math.abs(actual[key] - expected[key]) < 1e-8,
                `${key} differs for RA=${rightAscension}, dec=${declination}`,
              );
            }
          }
        }
      }
    }
  }
});

test("magnitude cutoff preserves descending catalog boundaries", () => {
  const stars = [7.5, 7, 7, 4, -1].map((magnitude) => ({ magnitude }));
  for (const [visibleMagnitude, expectedIndex] of [
    [8, 0],
    [7.5, 0],
    [7.25, 1],
    [7, 1],
    [6, 3],
    [-1, 4],
    [-2, 5],
  ]) {
    assert.equal(
      firstStarAtOrBelowMagnitude(stars, visibleMagnitude),
      expectedIndex,
    );
  }
});

test("sensor-noise crops are bounded, stable for five frames, and varied", () => {
  for (const [width, height] of [
    [220, 124],
    [292, 148],
    [360, 210],
  ]) {
    const uniqueCrops = new Set();
    for (let sample = 0; sample < 64; sample += 1) {
      const first = { x: 0, y: 0 };
      setSensorNoiseCrop(first, sample * 5 + 1, width, height);
      assert.ok(first.x >= 0 && first.x < width);
      assert.ok(first.y >= 0 && first.y < height);
      uniqueCrops.add(`${first.x},${first.y}`);

      for (let offset = 1; offset < 5; offset += 1) {
        const held = { x: 0, y: 0 };
        setSensorNoiseCrop(
          held,
          sample * 5 + 1 + offset,
          width,
          height,
        );
        assert.deepEqual(held, first);
      }
    }
    assert.ok(
      uniqueCrops.size >= 60,
      `${width}x${height} repeated too many crop windows`,
    );
  }
});

test("liquid-glass scissor bounds union, scale, flip, and clamp", () => {
  assert.deepEqual(
    computeGlassScissorBounds(
      [
        { left: 100, top: 200, width: 50, height: 40 },
        { left: 300, top: 100, width: 20, height: 30 },
      ],
      1000,
      800,
      1,
      10,
    ),
    { x: 90, y: 550, width: 240, height: 160 },
  );
  assert.deepEqual(
    computeGlassScissorBounds(
      [{ left: -5, top: 550, width: 100, height: 100 }],
      1500,
      900,
      1.5,
      20,
    ),
    { x: 0, y: 0, width: 173, height: 105 },
  );
  assert.equal(
    computeGlassScissorBounds(
      [null, { left: 20, top: 30, width: 0, height: 10 }],
      1000,
      800,
      1,
      10,
    ),
    null,
  );
  assert.equal(
    computeGlassScissorBounds(
      [{ left: 1100, top: 20, width: 50, height: 50 }],
      1000,
      800,
      1,
      0,
    ),
    null,
  );
});

test("pinch gestures measure distance and scale in both directions", () => {
  assert.equal(pointerDistance({ x: 10, y: 20 }, { x: 13, y: 24 }), 5);
  assert.equal(pinchRatio(100, 150), 1.5);
  assert.equal(pinchRatio(100, 50), 0.5);
  assert.equal(pinchRatio(0, 50), 1);
});

test("opening fireball stays near center and travels down-right", () => {
  const minimum = createOpeningFireballCue(() => 0);
  const maximum = createOpeningFireballCue(() => 0.999999);

  assert.ok(minimum.delay >= 0.38);
  assert.ok(maximum.delay <= 0.72);
  assert.ok(minimum.angleDegrees >= 25);
  assert.ok(maximum.angleDegrees < 39);
  assert.ok(minimum.originX >= 0.3);
  assert.ok(maximum.originX < 0.42);
  assert.ok(minimum.originY >= 0.26);
  assert.ok(maximum.originY < 0.38);
});

test("compiled locale defaults remain overridable by saved preference", () => {
  assert.equal(resolveInitialLocale(null, "en"), "en");
  assert.equal(resolveInitialLocale(null, "zh-TW"), "zh-TW");
  assert.equal(resolveInitialLocale("en", "zh-TW"), "en");
  assert.equal(resolveInitialLocale("zh-TW", "en"), "zh-TW");
  assert.equal(resolveInitialLocale("zh-CN", "en"), "zh-TW");
  assert.equal(resolveInitialLocale(null, "zh-CN"), "zh-TW");
  assert.equal(resolveInitialLocale("invalid", "zh-TW"), "zh-TW");
});

test("custom observing coordinates enforce geographic bounds", () => {
  assert.equal(isValidLatitude(25.033), true);
  assert.equal(isValidLatitude(-90), true);
  assert.equal(isValidLatitude(90), true);
  assert.equal(isValidLatitude(-90.01), false);
  assert.equal(isValidLatitude(90.01), false);
  assert.equal(isValidLatitude(Number.NaN), false);
  assert.equal(isValidLongitude(121.5654), true);
  assert.equal(isValidLongitude(-180), true);
  assert.equal(isValidLongitude(180), true);
  assert.equal(isValidLongitude(-180.01), false);
  assert.equal(isValidLongitude(180.01), false);
  assert.equal(isValidLongitude(Number.POSITIVE_INFINITY), false);
});

test("visibility coordinates place a meridian object at the expected altitude", () => {
  const latitudeDegrees = 25;
  const declinationDegrees = 10;
  const siderealAngle = 1.2;
  const coordinates = horizontalCoordinates(
    {
      rightAscension: siderealAngle,
      declination: (declinationDegrees * Math.PI) / 180,
    },
    latitudeDegrees,
    siderealAngle,
  );
  assert.ok(Math.abs(coordinates.altitudeDegrees - 75) < 1e-8);
  assert.ok(Math.abs(coordinates.azimuthDegrees - 180) < 1e-8);
});

function testObject(id, rightAscension, declination = 0, magnitude = 1) {
  return {
    id,
    name: { "zh-TW": id, en: id },
    kind: "star",
    rightAscension,
    declination,
    magnitude,
  };
}

test("visibility status respects horizon boundaries and tonight window", () => {
  const radians = Math.PI / 180;
  const sidereal = 0;

  assert.equal(
    calculateVisibility(testObject("overhead", sidereal), 0, sidereal).status,
    "visible",
  );
  assert.equal(
    calculateVisibility(testObject("low", 85 * radians), 0, sidereal).status,
    "low",
  );

  const later = calculateVisibility(
    testObject("later", 100 * radians),
    0,
    sidereal,
  );
  assert.equal(later.status, "later");
  assert.ok(later.risesInHours > 0 && later.risesInHours <= 12);

  const neverRises = calculateVisibility(
    testObject("never-rises", 0, 89 * radians),
    -90,
    sidereal,
  );
  assert.equal(neverRises.status, "not-tonight");
  assert.equal(neverRises.risesInHours, null);
});

test("fixed sky inputs preserve east-west direction and recommendation filtering", () => {
  const radians = Math.PI / 180;
  const east = horizontalCoordinates(
    testObject("east", 60 * radians),
    0,
    0,
  );
  const west = horizontalCoordinates(
    testObject("west", -60 * radians),
    0,
    0,
  );
  assert.ok(Math.abs(east.altitudeDegrees - 30) < 1e-8);
  assert.ok(Math.abs(east.azimuthDegrees - 90) < 1e-8);
  assert.ok(Math.abs(west.altitudeDegrees - 30) < 1e-8);
  assert.ok(Math.abs(west.azimuthDegrees - 270) < 1e-8);

  const recommendations = recommendTonight(
    [
      testObject("bright", 0, 0, -1),
      testObject("dim", 0, 0, 4),
      testObject("hidden", 0, 89 * radians, 1),
    ],
    -90,
    0,
    5,
  );
  assert.ok(recommendations.every((entry) => entry.status !== "not-tonight"));
  assert.ok(!recommendations.some((entry) => entry.object.id === "hidden"));
});

test("XHS build compiles with Chinese as its default locale", async () => {
  const config = await readFile(
    new URL("../vite.xhs.config.ts", import.meta.url),
    "utf8",
  );
  assert.match(
    config,
    /"process\.env\.NEXT_PUBLIC_DEFAULT_LOCALE": JSON\.stringify\("zh-TW"\)/,
  );
});

test("ships a real catalog and the temporal rendering systems", async () => {
  const [
    source,
    settingsSource,
    glassSource,
    cameraSource,
    css,
    readme,
    catalogText,
    milkyWayPanorama,
  ] = await Promise.all([
    readFile(new URL("../app/SkySimulator.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/simulation/settings.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/LiquidGlassMenu.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/CameraSystem.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(new URL("../public/data/stars.json", import.meta.url), "utf8"),
    readFile(
      new URL(
        "../public/textures/eso-milky-way-panorama-4096.jpg",
        import.meta.url,
      ),
    ),
  ]);
  const catalog = JSON.parse(catalogText);

  assert.equal(catalog.count, catalog.stars.length);
  assert.ok(
    catalog.stars.every(
      (star, index) =>
        index === 0 || catalog.stars[index - 1][2] >= star[2],
    ),
    "star catalog must remain sorted from dimmest to brightest",
  );
  assert.ok(catalog.count > 30_000);
  assert.ok(milkyWayPanorama.byteLength > 1_000_000);
  assert.match(source, /function temporalNoise\(/);
  assert.match(source, /function createGalacticPanoramaRenderer\(/);
  assert.match(
    source,
    /withBasePath\(\s*"\/textures\/eso-milky-way-panorama-4096\.jpg"/,
  );
  assert.match(source, /fetch\(withBasePath\("\/data\/stars\.json"\)\)/);
  assert.match(source, /u_camera_to_local/);
  assert.match(source, /float band_mask =/);
  assert.match(source, /eso-milky-way-panorama-4096\.jpg/);
  assert.doesNotMatch(source, /function buildMilkyWay\(/);
  assert.doesNotMatch(source, /\.filter\(\(row\) => row\[2\] <= 6\.95\)/);
  assert.match(source, /function drawPointedCapsule\(/);
  assert.match(source, /function drawCapsuleHead\(/);
  assert.match(source, /function drawDirectionalWake\(/);
  assert.match(source, /const energyBand =/);
  assert.match(source, /second\.energy > 1\.3/);
  assert.match(source, /flareWidth/);
  assert.match(source, /variant === "strong"/);
  assert.match(source, /settings\.directionSpread/);
  assert.match(source, /settings\.meteorSpeed/);
  assert.match(settingsSource, /ordinaryMeteorRatio: 74/);
  assert.match(source, /1 - settingsNow\.ordinaryMeteorRatio \/ 100/);
  assert.doesNotMatch(source, /ordinaryWeight|fireballWeight/);
  assert.match(source, /const ordinaryEnergy =/);
  assert.match(source, /const ordinarySpeedScale =/);
  assert.match(source, /const ordinaryTrackLength =/);
  assert.match(source, /ordinaryTrackLength \/ Math\.max\(1, speed\)/);
  assert.match(source, /function screenToLocalDirection\(/);
  assert.match(source, /function projectLocalDirection\(/);
  assert.match(source, /setEquatorialCoordinates\(star, row\[0\], row\[1\]\)/);
  assert.match(source, /const projectedStar: ProjectedCelestial/);
  assert.match(source, /defocus: seeded\(index \+ 2771\)/);
  assert.match(source, /const projected = projectCelestial\(/);
  assert.match(source, /function projectMeteorForView\(/);
  assert.match(source, /angularVelocity: Vector3/);
  assert.match(
    source,
    /direction: \[\.\.\.meteor\.direction\] as Vector3/,
  );
  assert.doesNotMatch(source, /meteor\.x \+= meteor\.vx/);
  assert.match(source, /meteor\.strength \* 1\.25/);
  assert.match(settingsSource, /starExposure: 3\.2/);
  assert.match(settingsSource, /skyBrightness: 0\.67/);
  assert.match(settingsSource, /skyHue: 218/);
  assert.match(settingsSource, /skySaturation: 0\.4/);
  assert.match(
    source,
    /label=\{copy\.skyHue\}[\s\S]*?min=\{0\}[\s\S]*?max=\{360\}/,
  );
  assert.match(source, /label=\{copy\.skySaturation\}/);
  assert.match(source, /track="hue"/);
  assert.match(source, /track="saturation"/);
  assert.match(source, /trackHue=\{settings\.skyHue\}/);
  assert.match(source, /saturation \* 90/);
  assert.match(source, /saturation \* 100/);
  assert.match(source, /max=\{6\.4\}/);
  assert.match(source, /const exposureGain =/);
  assert.match(source, /settings\.ignitionTime/);
  assert.match(source, /settings\.burstChance/);
  assert.match(source, /settings\.burstPosition/);
  assert.match(source, /type MeteorVariant = "weak" \| "strong" \| null/);
  assert.match(source, /const imageMotion =/);
  assert.match(source, /noiseEnabled/);
  assert.match(source, /setSensorNoiseCrop\(/);
  assert.match(source, /noiseCanvas\.width = noiseSampleWidth \* 2/);
  assert.match(source, /globalCompositeOperation = "lighter"/);
  assert.match(source, /useState\(false\)/);
  assert.match(source, /<LiquidGlassMenu/);
  assert.match(source, /<TonightRecommendations/);
  assert.match(source, /sky:focus-object/);
  assert.match(source, /locale === "zh-TW"/);
  assert.match(source, /window\.localStorage\.setItem\("sky-locale"/);
  assert.match(source, /<details className="section">/);
  assert.match(source, /<summary className="section-toggle">/);
  assert.doesNotMatch(source, /section-index/);
  assert.match(glassSource, /LIQUID_GLASS_FRAGMENT_SHADER/);
  assert.match(glassSource, /const shouldDraw =/);
  assert.match(glassSource, /computeGlassScissorBounds\(/);
  assert.match(glassSource, /gl\.enable\(gl\.SCISSOR_TEST\)/);
  assert.match(glassSource, /if \(wasDrawing \|\| resized\)/);
  assert.match(
    glassSource,
    /float distance = scene_distance\(position\);[\s\S]*?distance > u_glass_secondary\.w \* 2\.5[\s\S]*?float surface_visibility = scene_visibility\(position\);/,
  );
  assert.match(glassSource, /sd_smooth_round_rect/);
  assert.match(glassSource, /refract\(incident, surface_normal/);
  assert.match(glassSource, /texSubImage2D/);
  assert.match(glassSource, /onPointerDown=\{\(\) => onOpenChange\(false\)\}/);
  assert.match(glassSource, /const BUTTON_SIZE = 44/);
  assert.match(glassSource, /const CLOSED_MENU_SIZE = 36/);
  assert.match(glassSource, /const float CORNER_EXPONENT = 2\.0/);
  assert.match(glassSource, /return conservative_smooth_union\(/);
  assert.match(glassSource, /const MENU_WIDTH = 400/);
  assert.match(glassSource, /const MENU_MAX_HEIGHT = 680/);
  assert.match(glassSource, /const OPEN_MENU_RADIUS = 40/);
  assert.match(glassSource, /stiffness: 499/);
  assert.match(glassSource, /stiffness: 144/);
  assert.match(glassSource, /Easing\.bezier\(0\.8, 0\.3, 0\.5, 0\.8\)/);
  assert.match(
    glassSource,
    /const MENU_CLOSE_HEIGHT_TRANSITION = easing\(0\.18, Easing\.easeOut\)/,
  );
  assert.match(
    glassSource,
    /const CONTENT_OPACITY_CLOSE_TRANSITION = easing\(0\.08, Easing\.easeOut\)/,
  );
  assert.match(
    glassSource,
    /const buttonPositionTransition = menuPositionTransition/,
  );
  assert.match(glassSource, /const GLASS_SPACING = 37/);
  assert.match(glassSource, /const GLASS_BEZEL_WIDTH = 70/);
  assert.match(glassSource, /const GLASS_THICKNESS = 40/);
  assert.match(glassSource, /const GLASS_BLUR = 20/);
  assert.match(glassSource, /const MOBILE_MENU_INSET = 14/);
  assert.match(glassSource, /const TRIGGER_IDLE_TIMEOUT = 2000/);
  assert.match(glassSource, /TRIGGER_VISIBILITY_TRANSITION = easing\(0\.18/);
  assert.match(glassSource, /window\.addEventListener\("pointermove"/);
  assert.match(glassSource, /window\.addEventListener\("click"/);
  assert.match(glassSource, /u_trigger_visibility/);
  assert.match(glassSource, /viewportHeight \* 0\.5/);
  assert.match(glassSource, /new ResizeObserver\(measureContent\)/);
  assert.match(glassSource, /contentRoot\.scrollHeight/);
  assert.match(glassSource, /function syncChannelToLayout\(/);
  assert.match(
    glassSource,
    /syncChannelToLayout\(channels\.menuHeight, geometry\.menuHeight\)/,
  );
  assert.match(
    glassSource,
    /syncChannelToLayout\(channels\.menuCenterY, geometry\.menuCenterY\)/,
  );
  assert.match(glassSource, /float sd_circle/);
  assert.match(cameraSource, /window\.indexedDB\.open/);
  assert.match(cameraSource, /source\.captureStream\(30\)/);
  assert.match(cameraSource, /new MediaRecorder/);
  assert.match(cameraSource, /globalCompositeOperation =[\s\S]*?"lighten"/);
  assert.match(cameraSource, /startViewTransition/);
  assert.match(cameraSource, /captures\.slice\(0, 3\)/);
  assert.match(cameraSource, /<video[\s\S]*?controls/);
  assert.match(cameraSource, /onWheel=\{handleZoom\}/);
  assert.match(cameraSource, /deleteStoredCapture/);
  assert.match(cameraSource, /downloadSelectedCapture/);
  assert.match(cameraSource, /gallery-info-sheet t-panel-slide/);
  assert.match(cameraSource, /gallery-more-menu t-dropdown/);
  assert.match(cameraSource, /CaptureKindIcon/);
  assert.match(cameraSource, /const hideIdleUi = !active && uiIdle/);
  assert.match(cameraSource, /menuOpen \? " menu-open-hidden" : ""/);
  assert.match(
    source,
    /keepTriggerVisible=\{cameraActive\}/,
  );
  assert.match(css, /\.sky-canvas\s*\{/);
  assert.match(css, /\.camera-mode-trigger/);
  assert.match(css, /\.long-exposure-preview/);
  assert.match(css, /\.gallery-grid/);
  assert.match(css, /\.gallery-kind-badge/);
  assert.match(css, /\.gallery-info-sheet/);
  assert.match(css, /\.gallery-more-menu/);
  assert.doesNotMatch(cameraSource, /gallery-grid-meta/);
  assert.match(css, /\.noise-toggle\.active/);
  assert.match(css, /\.range\.hue-range::/);
  assert.match(css, /\.range\.saturation-range::/);
  assert.match(css, /background: var\(--range-track-background\)/);
  assert.doesNotMatch(
    css,
    /::-webkit-slider-runnable-track,\s*\.range\.(?:hue|saturation)-range::-moz-range-track/,
  );
  assert.match(css, /hsl\(var\(--range-hue\) 100% 50%\)/);
  assert.match(css, /\.section \+ \.section/);
  assert.match(css, /\.section\[open\] \.section-chevron/);
  assert.match(css, /--collapse-container-duration: 180ms/);
  assert.match(
    css,
    /--collapse-container-easing: cubic-bezier\(0\.006, 0\.522, 0\.252, 0\.968\)/,
  );
  assert.match(css, /--collapse-content-duration: 200ms/);
  assert.match(
    css,
    /--collapse-content-easing: cubic-bezier\(0\.004, 0\.505, 0\.202, 0\.918\)/,
  );
  assert.match(css, /--collapse-content-scale-hidden: 0\.98/);
  assert.match(css, /--collapse-content-translate-y-hidden: -10px/);
  assert.match(css, /\.section::details-content/);
  assert.match(css, /margin-inline: -10px/);
  assert.match(css, /padding-inline: 10px/);
  assert.match(css, /--scroll-edge-fade: 24px/);
  assert.match(css, /mask-image: linear-gradient/);
  assert.match(css, /\.button-content span/);
  assert.match(css, /\.glass-dismiss-layer\.active/);
  assert.match(css, /--glass-tint: rgba\(40, 40, 40, 0\.4\)/);
  assert.match(css, /--glass-foreground: #f5f7ff/);
  assert.doesNotMatch(css, /\.sky-canvas\.menu-open/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(readme, /^# AstroShot$/m);
  assert.match(readme, /AndrewPrifer\/liquid-dom/);
  assert.doesNotMatch(readme, /[\u3400-\u9fff]/);
  assert.doesNotMatch(
    readme,
    /spacing=37|bezelWidth=70|499 \/ 22|400 × 680|contentIor|contentDepth/,
  );
});
