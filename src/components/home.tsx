import React from "react";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";
import CurrencyConverter from "./budgetTracker/CurrencyConverter";
import Weather from "./Weather/Weather";

const home = () => {
  const navigate = useNavigate();

  return (
    <div className="container py-5">
      <div className="row gx-4 gy-4">
        <div className="col-lg-6 ">
          <div className=" border bg-gray-200 p-5 rounded-2xl shadow-lg">
            <h1 className="text-3xl font-bold underline">
              Welcome to RoamWise
            </h1>
            <p className="mt-4 text-lg">
              Your one-stop solution for travel planning and community
              engagement.
            </p>
            <p className="mt-2 text-lg">
              Join our community forum to share your travel experiences and get
              tips from fellow travelers.
            </p>
            <p className="mt-2 text-lg">
              Use our AI assistant to help you plan your next adventure!
            </p>
          </div>
        </div>
        <div className="col-lg-6">
          <CurrencyConverter />
          <div className="my-4" />
          <Weather />
        </div>
      </div>
    </div>
  );
};

export default home;
