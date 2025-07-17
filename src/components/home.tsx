import React from "react";
import { useNavigate } from "react-router-dom";
import CurrencyConverter from "./budgetTracker/CurrencyConverter";
import Weather from "./Weather/Weather";
import {
  MessageSquare,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Settings,
} from "lucide-react";

const home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Forum",
      description: "Share your recent trips with fellow travelers",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: "Smart Planner",
      description: "Get ideas and advice for your trip with our AI Assistant",
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "My Trips",
      description: "Plan your trips with our collaborative planner",
    },
    {
      icon: <DollarSign className="w-5 h-5" />,
      title: "Trip Expenses",
      description: "Track your expenses for your trips",
    },
    {
      icon: <Users className="w-5 h-5" />,
      title: "Travel Buddies",
      description: "Form groups to collaborate with friends when planning",
    },
    {
      icon: <Settings className="w-5 h-5" />,
      title: "Tools",
      description: "Use our tools for planning (e.g., Explore Nearby)",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Card - Welcome Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-transparent mb-4">
                Welcome to RoamWise
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Your one-stop solution for collaborative travel planning
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Features & Tools
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors duration-300"
                  >
                    <div className="flex-shrink-0 p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg text-white">
                      {feature.icon}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Tools */}
          <div className="space-y-6">
            {/* Currency Converter Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Currency Converter
                </h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <CurrencyConverter />
              </div>
            </div>

            {/* Weather Card */}
            <div className="bg-white rounded-2xl shadow-xl p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800">
                  Weather Forecast
                </h2>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <Weather />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default home;
