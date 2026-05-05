"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { LocationSummary } from "@/lib/location-map";

const LeafletLocationMap = dynamic(
  () => import("@/components/shared/LeafletLocationMap").then((mod) => mod.LeafletLocationMap),
  { ssr: false }
);

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
const BONAIRE_CENTER = { latitude: 12.1696, longitude: -68.2883 };

type PickerValue = {
  label?: string | null;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

type NominatimSearchResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
  name?: string;
};

function toInitialSelection(value?: PickerValue | null): LocationSummary | null {
  if (!value) return null;
  const label = (value.label || "").trim();
  const address = (value.address || "").trim();
  const latitude = typeof value.latitude === "number" && Number.isFinite(value.latitude) ? value.latitude : null;
  const longitude = typeof value.longitude === "number" && Number.isFinite(value.longitude) ? value.longitude : null;
  if (!label && !address && latitude === null && longitude === null) return null;
  return { label, address, latitude, longitude };
}

function formatCoordinates(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) return "No coordinates selected";
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function buildOpenStreetMapUrl(selection: LocationSummary | null) {
  if (selection && selection.latitude !== null && selection.longitude !== null) {
    return `https://www.openstreetmap.org/?mlat=${selection.latitude}&mlon=${selection.longitude}#map=16/${selection.latitude}/${selection.longitude}`;
  }

  return `https://www.openstreetmap.org/#map=12/${BONAIRE_CENTER.latitude}/${BONAIRE_CENTER.longitude}`;
}

async function fetchNominatim(pathname: string, params: URLSearchParams) {
  const response = await fetch(`${NOMINATIM_BASE_URL}${pathname}?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "Accept-Language": typeof navigator !== "undefined" ? navigator.language : "en",
    },
  });

  if (!response.ok) {
    throw new Error("Nominatim request failed");
  }

  return response.json();
}

async function searchNominatim(query: string) {
  const results = (await fetchNominatim(
    "/search",
    new URLSearchParams({
      q: query,
      format: "jsonv2",
      limit: "1",
      addressdetails: "1",
    })
  )) as NominatimSearchResult[];

  const first = results[0];
  if (!first?.lat || !first?.lon) return null;

  const address = (first.display_name || "").trim();
  const label = (first.name || address.split(",")[0] || query).trim();

  return {
    label,
    address,
    latitude: Number(first.lat),
    longitude: Number(first.lon),
  } satisfies LocationSummary;
}

async function reverseGeocode(latitude: number, longitude: number) {
  const result = (await fetchNominatim(
    "/reverse",
    new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: "jsonv2",
      zoom: "18",
      addressdetails: "1",
    })
  )) as NominatimSearchResult;

  const address = (result.display_name || "").trim();
  const label = (result.name || address.split(",")[0] || "Selected location").trim();

  return {
    label,
    address,
    latitude,
    longitude,
  } satisfies LocationSummary;
}

export function MapLocationPickerDialog({
  open,
  onOpenChange,
  value,
  title,
  description,
  searchPlaceholder,
  searchLabel,
  currentLocationLabel,
  locatingLabel,
  confirmLabel,
  cancelLabel,
  unavailableMessage,
  geolocationUnavailableMessage,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value?: PickerValue | null;
  title: string;
  description: string;
  searchPlaceholder: string;
  searchLabel: string;
  currentLocationLabel: string;
  locatingLabel: string;
  confirmLabel: string;
  cancelLabel: string;
  unavailableMessage: string;
  geolocationUnavailableMessage: string;
  onConfirm: (value: LocationSummary) => void;
}) {
  const initialSelection = useMemo(() => toInitialSelection(value), [value]);
  const [selection, setSelection] = useState<LocationSummary | null>(initialSelection);
  const [searchValue, setSearchValue] = useState(initialSelection?.address || initialSelection?.label || "");
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapInstanceKey, setMapInstanceKey] = useState(0);

  useEffect(() => {
    const nextSelection = toInitialSelection(value);
    setSelection(nextSelection);
    setSearchValue(nextSelection?.address || nextSelection?.label || "");
    setSearchError(null);
    setMapError(null);
  }, [value, open]);

  useEffect(() => {
    if (!open) return;
    setMapInstanceKey((current) => current + 1);
  }, [open]);

  const handleMapCoordinateSelect = useCallback(
    async (latitude: number, longitude: number) => {
      setSearchError(null);
      setMapError(null);
      setIsReverseGeocoding(true);

      const draftSelection: LocationSummary = {
        label: "Selected location",
        address: `Pinned location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
        latitude,
        longitude,
      };

      setSelection(draftSelection);

      try {
        const resolved = await reverseGeocode(latitude, longitude);
        setSelection(resolved);
        setSearchValue(resolved.address);
      } catch {
        setSearchError(unavailableMessage);
      } finally {
        setIsReverseGeocoding(false);
      }
    },
    [unavailableMessage]
  );

  const handleSearch = async () => {
    const query = searchValue.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const next = await searchNominatim(query);
      if (!next) {
        setSearchError(unavailableMessage);
        return;
      }

      setSelection(next);
      setSearchValue(next.address);
      setMapError(null);
    } catch {
      setSearchError(unavailableMessage);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setSearchError(geolocationUnavailableMessage);
      return;
    }

    setIsLocating(true);
    setSearchError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));

        const draftSelection: LocationSummary = {
          label: "Current location",
          address: `Current location (${latitude.toFixed(6)}, ${longitude.toFixed(6)})`,
          latitude,
          longitude,
        };

        setSelection(draftSelection);
        setMapError(null);
        setIsReverseGeocoding(true);

        try {
          const resolved = await reverseGeocode(latitude, longitude);
          setSelection(resolved);
          setSearchValue(resolved.address);
        } catch {
          setSearchError(unavailableMessage);
        } finally {
          setIsReverseGeocoding(false);
          setIsLocating(false);
        }
      },
      () => {
        setSearchError(geolocationUnavailableMessage);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  const confirmDisabled =
    !selection ||
    selection.latitude === null ||
    selection.longitude === null ||
    !selection.address ||
    isReverseGeocoding ||
    isLocating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border-[#efe7df] bg-white p-0">
        <div className="shrink-0 border-b border-[#efe7df] px-6 py-5">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-[#111111]">{title}</DialogTitle>
            <DialogDescription className="text-sm text-[#57534e]">{description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={searchPlaceholder}
              className="h-11 rounded-xl border-[#ece7e2] bg-white text-[#111111]"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSearch}
              disabled={isSearching || isLocating}
              className="h-11 rounded-full border-[#e7dcd5] bg-white text-[#111111] hover:bg-[#faf8f6]"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {searchLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleUseCurrentLocation}
              disabled={isSearching || isLocating}
              className="h-11 rounded-full border-[#e7dcd5] bg-white text-[#111111] hover:bg-[#faf8f6]"
            >
              {isLocating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {isLocating ? locatingLabel : currentLocationLabel}
            </Button>
          </div>

          <div className="overflow-hidden rounded-[1.25rem] border border-[#efe7df] bg-[#faf8f6]">
            {open ? (
              <LeafletLocationMap
                key={mapInstanceKey}
                selection={selection}
                onSelectCoordinates={handleMapCoordinateSelect}
                onMapReady={() => setMapError(null)}
                onMapError={(message) => setMapError(message)}
              />
            ) : null}
          </div>

          {mapError ? (
            <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {mapError}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-[1rem] border border-[#efe7df] bg-[#fffaf5] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#78716c]">
              <MapPin className="mr-1 inline h-3.5 w-3.5" />
              Click anywhere on the map to drop a marker, or search to jump to an address.
            </p>
            <a
              href={buildOpenStreetMapUrl(selection)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-semibold text-[#b91c1c] hover:underline"
            >
              Open full map
            </a>
          </div>

          {searchError ? (
            <div className="rounded-[1rem] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {searchError}
            </div>
          ) : null}

          <div className="grid gap-3 rounded-[1.25rem] border border-[#efe7df] bg-[#faf8f6] p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8a29e]">Selected address</p>
              <p className="mt-2 text-sm text-[#111111]">{selection?.address || "No address selected yet"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#a8a29e]">Coordinates</p>
              <p className="mt-2 text-sm text-[#111111]">
                {isReverseGeocoding ? "Resolving address from pin..." : formatCoordinates(selection?.latitude ?? null, selection?.longitude ?? null)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t border-[#efe7df] bg-white px-6 py-5">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full border-[#e7dcd5]">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={confirmDisabled}
            onClick={() => {
              if (!selection) return;
              onConfirm(selection);
              onOpenChange(false);
            }}
            className="rounded-full bg-[#b91c1c] text-white hover:bg-[#991b1b]"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
