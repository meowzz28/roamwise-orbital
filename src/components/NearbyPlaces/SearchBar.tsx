import React, { useState, useEffect, useMemo } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { useMap, useMapsLibrary } from "@vis.gl/react-google-maps";

type PlaceOption = {
  description: string;
  place_id: string;
};

type Props = {
  onPlaceSelect: (location: google.maps.LatLngLiteral) => void;
};

const SearchBar: React.FC<Props> = ({ onPlaceSelect }) => {
  const map = useMap();
  const placesLib = useMapsLibrary("places");

  const [input, setInput] = useState("");
  const [options, setOptions] = useState<PlaceOption[]>([]);
  const [autocompleteService, setAutocompleteService] =
    useState<google.maps.places.AutocompleteService | null>(null);
  const [placesService, setPlacesService] =
    useState<google.maps.places.PlacesService | null>(null);

  // Initialize services once map and Places library are available
  useEffect(() => {
    if (placesLib && map) {
      setAutocompleteService(new placesLib.AutocompleteService());
      setPlacesService(new placesLib.PlacesService(map));
    }
  }, [placesLib, map]);

  // Fetch place predictions based on user input
  useEffect(() => {
    if (!autocompleteService || !input) return;

    autocompleteService.getPlacePredictions(
      { input },
      (predictions, status) => {
        if (
          status === google.maps.places.PlacesServiceStatus.OK &&
          predictions
        ) {
          setOptions(
            predictions.map((p) => ({
              description: p.description,
              place_id: p.place_id,
            }))
          );
        } else {
          setOptions([]);
        }
      }
    );
  }, [input, autocompleteService]);

  // Handle when a user selects a suggestion
  const handleSelect = (
    event: React.SyntheticEvent<Element, Event>,
    value: string | PlaceOption | null
  ) => {
    if (!value || !placesService) return;

    if (typeof value === "string") {
      autocompleteService?.getPlacePredictions(
        { input: value },
        (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions &&
            predictions.length > 0
          ) {
            const placeId = predictions[0].place_id;

            placesService?.getDetails({ placeId }, (place, status) => {
              if (
                status === google.maps.places.PlacesServiceStatus.OK &&
                place?.geometry?.location
              ) {
                const location = {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng(),
                };
                onPlaceSelect(location);
              }
            });
          }
        }
      );
      return;
    }

    placesService.getDetails({ placeId: value.place_id }, (place, status) => {
      if (
        status === google.maps.places.PlacesServiceStatus.OK &&
        place?.geometry?.location
      ) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        onPlaceSelect(location);
      }
    });
  };

  return (
    <Autocomplete
      freeSolo
      options={options}
      getOptionLabel={(option) =>
        typeof option === "string" ? option : option.description
      }
      onInputChange={(_, newValue) => setInput(newValue)}
      onChange={handleSelect}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search a starting location"
          variant="outlined"
          fullWidth
          sx={{ backgroundColor: "white" }}
        />
      )}
      sx={{
        width: "100%",
        maxWidth: 600,
        margin: "16px auto",
        zIndex: 10,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
      }}
    />
  );
};

export default SearchBar;
