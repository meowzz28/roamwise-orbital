import React, { useEffect, useState } from "react";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

type Props = {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  onBack: () => void;
  destinationPlace: google.maps.places.PlaceResult | null;
};

const Directions = ({
  origin,
  destination,
  onBack,
  destinationPlace,
}: Props) => {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");

  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService>();
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer>();
  const [routes, setRoutes] = useState<google.maps.DirectionsRoute[]>([]);
  const [routeIndex, setRouteIndex] = useState(0);
  const [travelMode] = useState<google.maps.TravelMode>(
    google.maps.TravelMode.WALKING
  );

  const selected = routes[routeIndex];
  const leg = selected?.legs[0];

  useEffect(() => {
    if (!routesLib || !map) return;

    const service = new routesLib.DirectionsService();
    const renderer = new routesLib.DirectionsRenderer({ map });

    setDirectionsService(service);
    setDirectionsRenderer(renderer);

    return () => {
      renderer.setMap(null);
    };
  }, [routesLib, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer || !map) return;

    directionsService
      .route({
        origin,
        destination,
        travelMode,
        provideRouteAlternatives: true,
      })
      .then((response) => {
        directionsRenderer.setDirections(response);
        directionsRenderer.setMap(map);
        setRoutes(response.routes);
        setRouteIndex(0);
      });
  }, [
    origin,
    destination,
    travelMode,
    directionsService,
    directionsRenderer,
    map,
  ]);

  useEffect(() => {
    if (!directionsRenderer) return;
    directionsRenderer.setRouteIndex(routeIndex);
  }, [routeIndex, directionsRenderer]);

  if (!leg) return null;

  return (
    <div className="w-full h-full bg-white shadow-md overflow-y-auto p-6 space-y-4 text-gray-800">
      <button
        onClick={() => {
          directionsRenderer?.setMap(null);
          onBack();
        }}
        className="text-blue-600 font-medium hover:underline"
      >
        ← Back
      </button>

      {destinationPlace?.name && (
        <h2 className="text-2xl font-bold text-gray-900">
          {destinationPlace.name}
        </h2>
      )}

      <h3 className="text-lg font-semibold text-gray-900">
        Route: {selected.summary}
      </h3>

      <div className="space-y-1 text-sm text-gray-700">
        <p>
          <strong>From:</strong> {leg.start_address}
        </p>
        <p>
          <strong>To:</strong> {leg.end_address}
        </p>
        <p>
          <strong>Distance:</strong> {leg.distance?.text}
        </p>
        <p>
          <strong>Duration:</strong> {leg.duration?.text}
        </p>
        <p>
          <strong>Mode:</strong> Walking 🚶‍♂️
        </p>
      </div>

      {routes.length > 1 && (
        <div>
          <h3 className="text-md font-semibold mb-2">Other Route Options:</h3>
          <ul className="space-y-2">
            {routes.map((route, idx) => (
              <li key={route.summary}>
                {idx === routeIndex ? (
                  <span className="font-medium text-blue-600">
                    ✅ {route.summary}
                  </span>
                ) : (
                  <button
                    onClick={() => setRouteIndex(idx)}
                    className="text-left w-full bg-gray-100 hover:bg-blue-600 hover:text-white text-sm px-3 py-2 rounded-md transition"
                  >
                    {route.summary}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Directions;
