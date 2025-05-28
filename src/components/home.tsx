import React from "react";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

const home = () => {
  const navigate = useNavigate();
  const forceLogout = async () => {
    try {
      await auth.signOut(); // Sign out from Firebase Authentication
      localStorage.clear(); // Clear local storage (if used)
      sessionStorage.clear(); // Clear session storage (if used)
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Error forcefully logging out:", error.message);
    }
  };
  return (
    <div className="container bg-gray-200 p-5 rounded shadow-lg ">
      <h1 className="text-3xl font-bold underline">Welcome to RoamWise</h1>
      <p className="mt-4 text-lg">
        Your one-stop solution for travel planning and community engagement.
      </p>
      <p className="mt-2 text-lg">
        Join our community forum to share your travel experiences and get tips
        from fellow travelers.
      </p>
      <p className="mt-2 text-lg">
        Use our AI assistant to help you plan your next adventure!
      </p>
    </div>
  );
};

export default home;
