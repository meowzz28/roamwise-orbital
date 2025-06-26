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
        <div className="col-lg-6">
          <div className="group border bg-gradient-to-br from-gray-100 to-gray-300 p-5 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-pulse-once">
            <h1 className="text-3xl font-bold underline bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
              Welcome to RoamWise ✈️
            </h1>
            <div className="space-y-2 mt-4">
              <p className="text-lg transform translate-x-0 group-hover:translate-x-2 transition-transform duration-300 delay-100">
                🌍 Your one-stop solution for travel planning and community
                engagement.
              </p>
              <p className="text-lg transform translate-x-0 group-hover:translate-x-2 transition-transform duration-300 delay-200">
                💬 Join our community forum to share experiences and get tips.
              </p>
              <p className="text-lg transform translate-x-0 group-hover:translate-x-2 transition-transform duration-300 delay-300">
                🤖 Use our AI assistant to plan your next adventure!
              </p>
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="group border bg-gradient-to-br from-gray-300 to-gray-100 p-3 rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-pulse-once">
            <CurrencyConverter />
          </div>
          <div className="my-4"></div>
          <div className=" border bg-gradient-to-br from-gray-300 to-gray-100  rounded-2xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 animate-pulse-once">
            <Weather />
          </div>
        </div>
      </div>
    </div>
  );
};

export default home;
