const AttractionDetailPanel = ({
  place,
  onClose,
  onGetDirections,
}: {
  place: google.maps.places.PlaceResult;
  onClose: () => void;
  onGetDirections: () => void;
}) => {
  return (
    <div className="w-full h-full bg-white shadow-md overflow-y-auto p-4">
      <button onClick={onClose} className="mb-4 text-blue-500">
        ← Back
      </button>

      <h2 className="text-xl font-semibold">{place.name}</h2>
      <div className="text-yellow-500 text-sm mb-1">
        {place.rating} ★ ({place.user_ratings_total} reviews)
      </div>
      <div className="text-sm text-gray-600 mb-2 capitalize">
        {place.types?.[0]?.replace("_", " ")}
      </div>

      <div className="text-sm mb-1">
        <strong>Address:</strong> {place.formatted_address || place.vicinity}
      </div>
      {place.formatted_phone_number && (
        <div className="text-sm mb-1">
          <strong>Phone:</strong> {place.formatted_phone_number}
        </div>
      )}
      {place.website && (
        <div className="text-sm mb-1">
          <strong>Website:</strong>{" "}
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {place.website.replace("https://", "")}
          </a>
        </div>
      )}
      {place.opening_hours?.weekday_text && (
        <div className="text-sm mt-2">
          <strong>Opening Hours:</strong>
          <ul className="ml-4 list-disc">
            {place.opening_hours.weekday_text.map((line, idx) => (
              <li key={idx}>{line}</li>
            ))}
          </ul>
        </div>
      )}
      {place.geometry?.location && (
        <button
          onClick={onGetDirections}
          disabled={!place.geometry?.location}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Get Walking Directions
        </button>
      )}
      {place.reviews && place.reviews.length > 0 && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Reviews</h3>
          {place.reviews.map((review, idx) => (
            <div key={idx} className="mb-4 border-t pt-3">
              <div className="flex items-center mb-1">
                {review.profile_photo_url && (
                  <img
                    src={review.profile_photo_url}
                    alt={review.author_name}
                    className="w-8 h-8 rounded-full mr-2"
                  />
                )}
                <div>
                  <div className="font-medium">{review.author_name}</div>
                  <div className="text-yellow-500 text-sm">
                    {"★".repeat(review.rating ?? 0)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {review.relative_time_description}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-800">{review.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AttractionDetailPanel;
