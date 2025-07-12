import React, { useEffect, useRef, useCallback, useState } from "react";
import { AdvancedMarker, Pin, useMap } from "@vis.gl/react-google-maps";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Marker } from "@googlemaps/markerclusterer";
import { Circle } from "./circle";

type Poi = {
  key: string;
  location: google.maps.LatLngLiteral;
  name?: string;
  placeId?: string;
  rating?: number;
  type: "origin" | "attraction" | "restaurant" | "hotel";
};

type Props = {
  pois: Poi[];
  onAttractionClick: (poi: Poi) => void;
  selectedAttraction?: Poi | null;
};

const PoiMarker = ({ pois, onAttractionClick, selectedAttraction }: Props) => {
  const map = useMap();
  const markersRef = useRef<Record<string, Marker>>({});
  const clusterer = useRef<MarkerClusterer | null>(null);

  // Get user's location (used for drawing the surrounding circle)
  const origin = pois.find((poi) => poi.type === "origin");
  const circleCenter = origin ? origin.location : null;

  // Initialize marker clusterer when the map is available
  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  // Update cluster markers whenever the POIs change
  useEffect(() => {
    if (!clusterer.current) return;
    const currentMarkers = Object.values(markersRef.current);
    clusterer.current.clearMarkers();
    clusterer.current.addMarkers(currentMarkers);
  }, [pois]);

  // Track and update markers in the ref map
  const setMarkerRef = (marker: Marker | null, key: string) => {
    const existingMarker = markersRef.current[key];

    if (marker && existingMarker === marker) return;
    if (!marker && !existingMarker) return;

    if (marker) {
      markersRef.current[key] = marker;
    } else {
      delete markersRef.current[key];
    }
  };

  // Handle marker click: pan to location and optionally trigger attraction callback
  const handleClick = useCallback(
    (poi: Poi) => {
      if (!map) return;
      map.panTo(poi.location);
      if (
        poi.type === "attraction" ||
        poi.type === "hotel" ||
        poi.type === "restaurant"
      ) {
        onAttractionClick(poi);
      }
    },
    [map, onAttractionClick]
  );

  return (
    <>
      <Circle
        radius={800}
        center={circleCenter}
        strokeColor="#0c4cb3"
        strokeOpacity={1}
        strokeWeight={3}
        fillColor="#3b82f6"
        fillOpacity={0.3}
        clickable={false}
      />

      {/* Render a marker for each POI */}
      {pois.map((poi) => (
        <AdvancedMarker
          key={poi.key}
          position={poi.location}
          ref={(marker) => setMarkerRef(marker, poi.key)}
          clickable
          onClick={() => handleClick(poi)}
        >
          <Pin
            background={
              poi.type === "origin"
                ? "#2563eb"
                : selectedAttraction?.key === poi.key
                ? "#a855f7"
                : "#10b981"
            }
            glyphColor="white"
          />
        </AdvancedMarker>
      ))}
    </>
  );
};

export default PoiMarker;
