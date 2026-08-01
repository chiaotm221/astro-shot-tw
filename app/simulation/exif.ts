export type PhotoExif = {
  make: string | null;
  model: string | null;
  orientation: number | null;
  capturedAt: string | null;
  capturedAtOffset: string | null;
  focalLengthMm: number | null;
  focalLength35Mm: number | null;
  latitude: number | null;
  longitude: number | null;
  altitudeMeters: number | null;
  headingDegrees: number | null;
  headingReference: "true" | "magnetic" | null;
};

const EMPTY_EXIF: PhotoExif = { make: null, model: null, orientation: null, capturedAt: null, capturedAtOffset: null, focalLengthMm: null, focalLength35Mm: null, latitude: null, longitude: null, altitudeMeters: null, headingDegrees: null, headingReference: null };

type Entry = { type: number; count: number; valueOffset: number; inlineOffset: number };

export function readJpegExif(buffer: ArrayBuffer): PhotoExif {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  if (bytes.length < 4 || view.getUint16(0) !== 0xffd8) return { ...EMPTY_EXIF };
  let cursor = 2;
  while (cursor + 4 <= bytes.length) {
    if (bytes[cursor] !== 0xff) break;
    const marker = bytes[cursor + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = view.getUint16(cursor + 2);
    if (length < 2 || cursor + 2 + length > bytes.length) break;
    if (marker === 0xe1 && length >= 8 && String.fromCharCode(...bytes.slice(cursor + 4, cursor + 10)) === "Exif\0\0") {
      return readTiff(view, cursor + 10, cursor + 2 + length);
    }
    cursor += 2 + length;
  }
  return { ...EMPTY_EXIF };
}

function readTiff(view: DataView, base: number, end: number): PhotoExif {
  if (base + 8 > end) return { ...EMPTY_EXIF };
  const byteOrder = view.getUint16(base);
  const little = byteOrder === 0x4949;
  if (!little && byteOrder !== 0x4d4d) return { ...EMPTY_EXIF };
  const u16 = (offset: number) => view.getUint16(offset, little);
  const u32 = (offset: number) => view.getUint32(offset, little);
  if (u16(base + 2) !== 42) return { ...EMPTY_EXIF };
  const safe = (offset: number, size = 1) => offset >= base && offset + size <= end;
  const readEntries = (relativeOffset: number) => {
    const entries = new Map<number, Entry>();
    const offset = base + relativeOffset;
    if (!safe(offset, 2)) return entries;
    const count = Math.min(u16(offset), 256);
    for (let index = 0; index < count; index++) {
      const item = offset + 2 + index * 12;
      if (!safe(item, 12)) break;
      const type = u16(item + 2);
      const valueCount = u32(item + 4);
      entries.set(u16(item), { type, count: valueCount, valueOffset: base + u32(item + 8), inlineOffset: item + 8 });
    }
    return entries;
  };
  const typeSize = (type: number) => ({ 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 }[type] ?? 0);
  const entryOffset = (entry: Entry) => entry.count * typeSize(entry.type) <= 4 ? entry.inlineOffset : entry.valueOffset;
  const text = (entry?: Entry) => {
    if (!entry || entry.type !== 2) return null;
    const offset = entryOffset(entry);
    if (!safe(offset, entry.count)) return null;
    return new TextDecoder("ascii").decode(new Uint8Array(view.buffer, view.byteOffset + offset, Math.max(0, entry.count - 1))).trim() || null;
  };
  const number = (entry?: Entry, index = 0): number | null => {
    if (!entry || index >= entry.count) return null;
    const offset = entryOffset(entry) + index * typeSize(entry.type);
    if (!safe(offset, typeSize(entry.type))) return null;
    if (entry.type === 1) return view.getUint8(offset);
    if (entry.type === 3) return u16(offset);
    if (entry.type === 4) return u32(offset);
    if (entry.type === 5) { const denominator = u32(offset + 4); return denominator ? u32(offset) / denominator : null; }
    if (entry.type === 9) return view.getInt32(offset, little);
    if (entry.type === 10) { const denominator = view.getInt32(offset + 4, little); return denominator ? view.getInt32(offset, little) / denominator : null; }
    return null;
  };
  const root = readEntries(u32(base + 4));
  const exifOffset = number(root.get(0x8769));
  const gpsOffset = number(root.get(0x8825));
  const exif = exifOffset === null ? new Map<number, Entry>() : readEntries(exifOffset);
  const gps = gpsOffset === null ? new Map<number, Entry>() : readEntries(gpsOffset);
  const coordinate = (tag: number, refTag: number) => {
    const entry = gps.get(tag);
    const degrees = number(entry, 0); const minutes = number(entry, 1); const seconds = number(entry, 2);
    if (degrees === null || minutes === null || seconds === null) return null;
    const ref = text(gps.get(refTag));
    return (degrees + minutes / 60 + seconds / 3600) * (ref === "S" || ref === "W" ? -1 : 1);
  };
  const altitude = number(gps.get(0x0006));
  const heading = number(gps.get(0x0011));
  const headingRef = text(gps.get(0x0010));
  const latitude = coordinate(0x0002, 0x0001);
  const longitude = coordinate(0x0004, 0x0003);
  const focalLength = number(exif.get(0x920a));
  const focalLength35 = number(exif.get(0xa405));
  const orientation = number(root.get(0x0112));
  const normalizedOffset = text(exif.get(0x9011));
  return {
    make: text(root.get(0x010f)), model: text(root.get(0x0110)), orientation: orientation !== null && [1, 3, 6, 8].includes(orientation) ? orientation : null,
    capturedAt: text(exif.get(0x9003)) ?? text(root.get(0x0132)),
    capturedAtOffset: normalizedOffset && /^[+-](?:0\d|1\d|2[0-3]):[0-5]\d$/.test(normalizedOffset) ? normalizedOffset : null,
    focalLengthMm: focalLength !== null && focalLength > 0 && focalLength <= 2000 ? focalLength : null,
    focalLength35Mm: focalLength35 !== null && focalLength35 > 0 && focalLength35 <= 2000 ? focalLength35 : null,
    latitude: latitude !== null && latitude >= -90 && latitude <= 90 ? latitude : null,
    longitude: longitude !== null && longitude >= -180 && longitude <= 180 ? longitude : null,
    altitudeMeters: altitude === null || altitude > 20000 ? null : altitude * (number(gps.get(0x0005)) === 1 ? -1 : 1),
    headingDegrees: heading === null ? null : ((heading % 360) + 360) % 360,
    headingReference: headingRef === "T" ? "true" : headingRef === "M" ? "magnetic" : null,
  };
}

export function hasExifData(exif: PhotoExif) {
  return Object.values(exif).some((value) => value !== null);
}
