import React, { useState, useEffect } from "react";
import {
  Map,
  MapCameraChangedEvent,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import PoiMarker from "./PoIMarker";
import SearchBar from "./SearchBar";
import AttractionFetcher from "./AttractionFetcher";
import LeftPanel from "./LeftPanel";
import AttractionDetailPanel from "./AttractionDetailPanel";
import Directions from "./Directions";

type PlaceType = "attraction" | "restaurant" | "hotel";

type Poi = {
  key: string;
  location: google.maps.LatLngLiteral;
  name?: string;
  placeId?: string;
  rating?: number;
  user_ratings_total?: number;
  type: "origin" | "attraction" | "restaurant" | "hotel";
};

const MapLogic = () => {
  const [origin, setOrigin] = useState<Poi | null>(null);
  const [attractions, setAttractions] = useState<Poi[]>([]);
  const [center, setCenter] = useState<google.maps.LatLngLiteral>({
    lat: -33.860664,
    lng: 151.208138,
  });
  const [zoom, setZoom] = useState(13);
  const [selectedAttraction, setSelectedAttraction] = useState<Poi | null>(
    null
  );
  const [selectedAttractionDetail, setSelectedAttractionDetail] =
    useState<google.maps.places.PlaceResult | null>(null);

  const map = useMap();
  const placesLib = useMapsLibrary("places");
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);
  const [showDirections, setShowDirections] = useState<{
    origin: google.maps.LatLngLiteral;
    destination: google.maps.LatLngLiteral;
  } | null>(null);
  const [filters, setFilters] = useState<PlaceType[]>([
    "attraction",
    "restaurant",
    "hotel",
  ]);

  useEffect(() => {
    if (placesLib && map) {
      setPlacesService(new placesLib.PlacesService(map));
    }
  }, [placesLib, map]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const userPoi: Poi = {
          key: "user-location",
          location: userLoc,
          type: "origin",
        };
        setCenter(userLoc);
        setZoom(16);
        setOrigin(userPoi);
        setAttractions([]);
      },
      (error) => {
        console.warn("Geolocation error:", error);
      }
    );
  }, []);

  const goToCurrentLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLoc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const userPoi: Poi = {
          key: "user-location",
          location: userLoc,
          type: "origin",
        };
        setCenter(userLoc);
        setZoom(16);
        setOrigin(userPoi);
        setAttractions([]);
      },
      (error) => {
        console.warn("Geolocation error:", error);
      }
    );
  };

  const handlePlaceSelect = (location: google.maps.LatLngLiteral) => {
    const selectedPoi: Poi = {
      key: "selected-location",
      location,
      type: "origin",
    };
    setCenter(location);
    setZoom(16);
    setOrigin(selectedPoi);
    setAttractions([]);
  };

  const handleAttractionClick = (poi: Poi) => {
    if (showDirections) {
      setShowDirections(null);
    }
    setSelectedAttraction(poi);
    setCenter(poi.location);
    setZoom(18);

    if (!placesService || !poi.placeId) return;

    const request: google.maps.places.PlaceDetailsRequest = {
      placeId: poi.placeId,
      fields: [
        "name",
        "formatted_address",
        "geometry",
        "place_id",
        "rating",
        "user_ratings_total",
        "types",
        "formatted_phone_number",
        "website",
        "opening_hours",
        "photos",
        "reviews",
      ],
    };

    placesService.getDetails(request, (result, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && result) {
        setSelectedAttractionDetail(result);
      } else {
        console.log("Details failed:", status);
      }
    });
  };

  const handleGetDirections = (destinationLoc: google.maps.LatLngLiteral) => {
    if (!origin) return;
    setShowDirections({
      origin: origin.location,
      destination: destinationLoc,
    });
  };

  const filteredAttractions = attractions.filter(
    (a) => a.type !== "origin" && filters.includes(a.type as PlaceType)
  );

  return (
    <div className="h-dvh w-full">
      <Map
        zoom={zoom}
        center={center}
        mapId="478ecfd2eadfdcb62a65166f"
        onCameraChanged={(ev: MapCameraChangedEvent) => {
          setCenter(ev.detail.center);
          setZoom(ev.detail.zoom);
        }}
      >
        <button
          onClick={goToCurrentLocation}
          className="absolute top-20 right-4 z-10 bg-white border border-gray-300 shadow-md rounded px-4 py-2 text-sm hover:bg-gray-100"
        >
          Use Current Location
        </button>

        <div className="absolute top-0 left-0 z-10 w-[380px] h-full bg-white shadow-md overflow-y-auto">
          {showDirections ? (
            <Directions
              origin={showDirections.origin}
              destination={showDirections.destination}
              onBack={() => setShowDirections(null)}
              destinationPlace={selectedAttractionDetail}
            />
          ) : selectedAttractionDetail ? (
            <AttractionDetailPanel
              place={selectedAttractionDetail}
              onClose={() => {
                setSelectedAttractionDetail(null);
                setSelectedAttraction(null);
              }}
              onGetDirections={() => {
                const location =
                  selectedAttractionDetail.geometry?.location?.toJSON();
                if (location) handleGetDirections(location);
              }}
            />
          ) : (
            <LeftPanel
              attractions={filteredAttractions}
              onAttractionClick={(place) => handleAttractionClick(place)}
              filters={filters}
              setFilters={setFilters}
            />
          )}
        </div>

        <SearchBar onPlaceSelect={handlePlaceSelect} />

        <PoiMarker
          pois={[...(origin ? [origin] : []), ...filteredAttractions]}
          onAttractionClick={(place) => handleAttractionClick(place)}
          selectedAttraction={selectedAttraction}
        />

        <AttractionFetcher origin={origin} onUpdate={setAttractions} />
      </Map>
    </div>
  );
};

export default MapLogic;
