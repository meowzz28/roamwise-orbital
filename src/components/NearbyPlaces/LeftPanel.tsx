import React from "react";

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

type Props = {
  attractions: Poi[];
  onAttractionClick: (poi: Poi) => void;
  filters: PlaceType[];
  setFilters: React.Dispatch<React.SetStateAction<PlaceType[]>>;
};

const LeftPanel = ({
  attractions,
  onAttractionClick,
  filters,
  setFilters,
}: Props) => {
  // Display labels for each type of place
  const typeLabels: { [key in PlaceType]: string } = {
    attraction: "Attractions",
    restaurant: "Restaurants",
    hotel: "Hotels",
  };

  // Toggle a filter type: remove if selected, add if not
  const toggleFilter = (type: PlaceType) => {
    setFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="absolute left-0 top-0 w-96 h-full bg-white shadow-md z-20 overflow-y-auto p-4">
      <h2 className="text-xl font-bold mb-4">Nearby Places</h2>

      {/* Filter toggle buttons */}
      <div className="flex gap-2 mb-4">
        {Object.entries(typeLabels).map(([type, label]) => (
          <button
            key={type}
            onClick={() => toggleFilter(type as PlaceType)}
            className={`px-3 py-1 text-sm rounded border ${
              filters.includes(type as PlaceType)
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {/* Render filtered attractions */}
      {attractions.map((poi) => (
        <div
          key={poi.key}
          className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded"
          onClick={() => onAttractionClick(poi)}
        >
          <div className="font-semibold">{poi.name}</div>
          {/* Show rating if available */}
          {poi.rating && (
            <div className="text-yellow-500 text-sm">
              {poi.rating} ★ ({poi.user_ratings_total} reviews)
            </div>
          )}
          {/* Display the type of place */}
          <div className="text-sm text-gray-500 capitalize">{poi.type}</div>
        </div>
      ))}
    </div>
  );
};

export default LeftPanel;
