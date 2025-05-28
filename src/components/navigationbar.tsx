import React, { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { useNavigate } from "react-router-dom";

const Navigationbar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
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
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });
    return () => unsubscribe();
  }, []);
  return (
    <div>
      <nav className="bg-indigo-800 border-gray-200">
        <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
          <a
            href="/"
            className="rounded-md px-3 py-2 flex items-center hover:bg-gray-700"
            style={{ textDecoration: "none" }}
          >
            <span
              className="self-center text-4xl font-semibold text-white"
              style={{ fontFamily: "Brush Script MT" }}
            >
              RoamWise
            </span>
          </a>
          <div className="hidden sm:ml-6 sm:block">
            <div className="flex space-x-4">
              <a
                href="/forum"
                className="rounded-md px-3 py-2 text-white text-lg font-medium text-gray-300 hover:bg-gray-700"
                style={{ textDecoration: "none" }}
              >
                Community Forum
              </a>
              <a
                href="/chatbot"
                className="rounded-md px-3 py-2 text-white text-lg font-medium text-gray-300 hover:bg-gray-700"
                style={{ textDecoration: "none" }}
              >
                AI Assistant
              </a>
              <a
                href="/profile"
                className="rounded-md px-3 py-2 text-white text-lg font-medium text-gray-300 hover:bg-gray-700"
                style={{ textDecoration: "none" }}
              >
                Profile
              </a>
              {!isLoggedIn && (
                <a
                  href="/login"
                  className="rounded-md px-3 py-2 text-white text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  Login
                </a>
              )}
              {isLoggedIn && (
                <button className="btn btn-danger" onClick={forceLogout}>
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navigationbar;
