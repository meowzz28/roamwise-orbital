import React from "react";

type Poi = {
  key: string;
  location: google.maps.LatLngLiteral;
  name?: string;
  placeId?: string;
  rating?: number;
  user_ratings_total?: number;
  type: "origin" | "attraction";
};

type Props = {
  attractions: Poi[];
  onAttractionClick: (poi: Poi) => void;
};

const LeftPanel = ({ attractions, onAttractionClick }: Props) => {
  return (
    <div className="absolute left-0 top-0 w-96 h-full bg-white shadow-md z-20 overflow-y-auto p-4">
      <h2 className="text-xl font-bold mb-4">Nearby Attractions</h2>
      {attractions.map((poi) => (
        <div
          key={poi.key}
          className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded"
          onClick={() => onAttractionClick(poi)}
        >
          <div className="font-semibold">{poi.name}</div>
          {poi.rating && (
            <div className="text-yellow-500 text-sm">
              {poi.rating} ★ ({poi.user_ratings_total} reviews)
            </div>
          )}
          <div className="text-sm text-gray-500 capitalize">{poi.type}</div>
        </div>
      ))}
    </div>
  );
};

export default LeftPanel;
