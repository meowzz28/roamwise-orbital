import React from "react";
import { APIProvider } from "@vis.gl/react-google-maps";
import MapLogic from "./mapLogic";

const Nearby = () => {
  return (
    <APIProvider apiKey={import.meta.env.VITE_API_KEY_MAPS_API}>
      <MapLogic />
    </APIProvider>
  );
};

export default Nearby;
