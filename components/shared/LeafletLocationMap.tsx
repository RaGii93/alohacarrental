"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

type Selection = {
  latitude: number | null;
  longitude: number | null;
};

const BONAIRE_CENTER: [number, number] = [12.1696, -68.2883];
const BONAIRE_BOUNDS: [[number, number], [number, number]] = [
  [11.97, -68.53],
  [12.38, -68.18],
];
const PIN_ZOOM_LEVEL = 19;

const markerIcon = L.divIcon({
  className: "map-picker-marker",
  html: '<span class="map-picker-marker__pin"></span>',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

export function LeafletLocationMap({
  selection,
  onSelectCoordinates,
  onMapReady,
  onMapError,
}: {
  selection: Selection | null;
  onSelectCoordinates: (latitude: number, longitude: number) => void;
  onMapReady?: () => void;
  onMapError?: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    try {
      const map = L.map(containerRef.current, {
        center: BONAIRE_CENTER,
        zoom: 12,
        zoomControl: true,
        attributionControl: true,
      });

      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      map.on("click", (event) => {
        onSelectCoordinates(
          Number(event.latlng.lat.toFixed(6)),
          Number(event.latlng.lng.toFixed(6))
        );
      });

      window.setTimeout(() => {
        map.invalidateSize();
        onMapReady?.();
      }, 80);
    } catch (error) {
      console.error("Leaflet map mount failed", error);
      onMapError?.("The map could not be initialized in this browser session.");
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [onMapError, onMapReady, onSelectCoordinates]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    window.setTimeout(() => {
      map.invalidateSize();

      if (selection && selection.latitude !== null && selection.longitude !== null) {
        const latLng: [number, number] = [selection.latitude, selection.longitude];

        if (!markerRef.current) {
          markerRef.current = L.marker(latLng, { icon: markerIcon }).addTo(map);
        } else {
          markerRef.current.setLatLng(latLng);
        }

        map.setView(latLng, PIN_ZOOM_LEVEL, { animate: false });
        return;
      }

      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }

      map.fitBounds(BONAIRE_BOUNDS, { padding: [24, 24] });
    }, 50);
  }, [selection]);

  return <div ref={containerRef} className="leaflet-map-picker h-[16rem] w-full sm:h-[24rem]" />;
}
