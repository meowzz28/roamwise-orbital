import { useEffect } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

type PlaceType = "attraction" | "restaurant" | "hotel";

type Props = {
  origin: {
    location: google.maps.LatLngLiteral;
  } | null;
  onUpdate: (
    attractions: {
      key: string;
      location: google.maps.LatLngLiteral;
      name?: string;
      placeId?: string;
      rating?: number;
      user_ratings_total?: number;
      type: PlaceType;
    }[]
  ) => void;
};

const AttractionFetcher = ({ origin, onUpdate }: Props) => {
  const map = useMap();
  const placesLib = useMapsLibrary("places");

  useEffect(() => {
    if (!origin || !map || !placesLib) return;

    const service = new placesLib.PlacesService(map);

    const types: { apiType: string; label: PlaceType }[] = [
      { apiType: "tourist_attraction", label: "attraction" },
      { apiType: "restaurant", label: "restaurant" },
      { apiType: "lodging", label: "hotel" },
    ];

    let collected: Props["onUpdate"] extends (p: infer T) => void ? T : never =
      [];

    let completedCount = 0;

    types.forEach(({ apiType, label }) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: origin.location,
        radius: 800,
        type: apiType as any,
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const places = results.map((place) => ({
            key: place.place_id || place.name || Math.random().toString(),
            location: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            },
            name: place.name,
            placeId: place.place_id,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            type: label,
          }));

          collected = [...collected, ...places];
        } else {
          console.log(`Nearby search for ${apiType} failed:`, status);
        }

        completedCount++;

        if (completedCount === types.length) {
          onUpdate(collected);
        }
      });
    });
  }, [origin, map, placesLib, onUpdate]);

  return null;
};

export default AttractionFetcher;
