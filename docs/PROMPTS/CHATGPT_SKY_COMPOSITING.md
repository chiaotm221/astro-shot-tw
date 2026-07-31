# ChatGPT Prompt — Real Photo and Simulated Sky Compositing

Use this prompt with two attached images:

1. the original real-world photograph containing the foreground and horizon;
2. the AstroShot simulated sky or star-trail image aligned to the same view.

Replace the bracketed values when known. If a value is unknown, write
`unknown` rather than guessing.

## Primary Prompt

```text
Create a photorealistic composite using the two attached images.

Image 1 is the original real-world photograph. Preserve its foreground,
terrain, buildings, vegetation, people, reflections, framing, perspective,
resolution, and aspect ratio.

Image 2 is the simulated astronomical sky aligned for approximately:
- capture date and time: [DATE AND TIME]
- time zone: [TIME ZONE]
- latitude and longitude: [LATITUDE, LONGITUDE]
- elevation: [ELEVATION OR UNKNOWN]
- camera heading: [HEADING OR UNKNOWN]
- camera pitch: [PITCH OR UNKNOWN]
- camera roll: [ROLL OR UNKNOWN]
- field of view or focal length: [FIELD OF VIEW / FOCAL LENGTH OR UNKNOWN]
- exposure or star-trail duration: [DURATION OR POINT STARS]

Replace only the sky region of Image 1 with the astronomical sky from Image 2.
Create a precise natural mask along mountains, trees, roofs, antennas, people,
and all fine foreground edges. Preserve small branches and silhouettes. Do not
remove, invent, reshape, or relocate foreground objects.

Keep the star positions, Milky Way orientation, celestial rotation direction,
and star-trail geometry from Image 2. Do not invent constellations, move bright
stars, rotate the sky, mirror the sky, or generate a different astronomical
arrangement.

Match the sky to the original photograph's exposure, lens softness, noise,
white balance, atmospheric haze, horizon glow, and depth. Blend light spill
near the horizon naturally. Avoid an artificial cutout edge, excessive HDR,
oversaturated Milky Way colors, oversized stars, repeated star patterns, and
unrealistic foreground illumination.

If reflections or transparent surfaces in Image 1 show the sky, update them
only when geometrically appropriate. Otherwise preserve them.

Output one finished composite at the original aspect ratio and the highest
available resolution. Do not add text, logos, borders, watermarks, new objects,
or UI elements.
```

## Optional Strict Alignment Addition

Append this when astronomical direction is more important than dramatic style:

```text
Astronomical alignment is a hard constraint. Treat Image 2 as the authoritative
sky plate. You may adjust brightness, color, blur, grain, and atmospheric blend,
but do not geometrically transform the sky except for the minimum crop and
scaling required to match the already aligned canvas.
```

## Optional Star-Trail Addition

Append this for star trails:

```text
Preserve the exact trail direction, curvature, length, gaps, and rotation center
from Image 2. Do not convert trails into point stars, thicken them excessively,
or add unrelated trails. Blend trail brightness with the original exposure and
retain realistic sensor noise.
```

## Recommended Review Prompt

After the first result, use:

```text
Review the composite for masking errors around the horizon and fine branches,
geometric changes to the supplied sky, halos, repeated stars, unrealistic sky
brightness, inconsistent noise, and incorrect reflections. Correct only those
issues while preserving the foreground and astronomical alignment.
```

## Limitations

An image-generation model may still alter astronomical geometry. For scientific
or planning accuracy, compare the result against the original simulated sky and
retain the simulation image and metadata as the authoritative reference.
