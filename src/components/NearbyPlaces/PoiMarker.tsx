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

  const origin = pois.find((poi) => poi.type === "origin");
  const circleCenter = origin ? origin.location : null;

  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
  }, [map]);

  useEffect(() => {
    if (!clusterer.current) return;
    const currentMarkers = Object.values(markersRef.current);
    clusterer.current.clearMarkers();
    clusterer.current.addMarkers(currentMarkers);
  }, [pois]);

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
