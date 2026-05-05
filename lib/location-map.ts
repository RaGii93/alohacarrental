export type Coordinates = {
  latitude: number | null;
  longitude: number | null;
};

export type LocationSummary = {
  label: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

function hasFiniteCoordinate(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function hasCoordinates(latitude: number | null | undefined, longitude: number | null | undefined) {
  return hasFiniteCoordinate(latitude) && hasFiniteCoordinate(longitude);
}

export function parseNullableCoordinate(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildGoogleMapsUrl(input: {
  latitude?: number | null;
  longitude?: number | null;
  query?: string | null;
}) {
  if (hasCoordinates(input.latitude, input.longitude)) {
    return `https://www.google.com/maps/search/?api=1&query=${input.latitude},${input.longitude}`;
  }

  const query = (input.query || "").trim();
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function formatLocationSummary(input: {
  label?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}): LocationSummary {
  return {
    label: (input.label || "").trim(),
    address: (input.address || "").trim(),
    latitude: hasFiniteCoordinate(input.latitude) ? input.latitude : null,
    longitude: hasFiniteCoordinate(input.longitude) ? input.longitude : null,
  };
}
