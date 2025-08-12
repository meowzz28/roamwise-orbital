import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User } from "firebase/auth";
import { motion } from "framer-motion";
import Notification from "./notifications";
import { signOut } from "../services/authService";
import {
  UserCircle,
  ChevronDown,
  Settings,
  LogOut,
  User as UserIcon,
} from "lucide-react";

type Props = {
  user: User | null;
};

const Navigationbar = ({ user }: Props) => {
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const toolsDropdownRef = useRef<HTMLDivElement>(null);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserDropdown(false);
      }
      if (
        toolsDropdownRef.current &&
        !toolsDropdownRef.current.contains(event.target as Node)
      ) {
        setShowToolsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const forceLogout = async () => {
    try {
      await signOut();
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
      setShowUserDropdown(false);
    } catch (error) {
      console.error("Error forcefully logging out:", error);
    }
  };

  const handleProfileClick = () => {
    navigate("/profile");
    setShowUserDropdown(false);
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 shadow-md border-b border-gray-300">
      <div className="max-w-screen-xl mx-auto flex flex-wrap items-center justify-between p-4">
        <Link
          to="/"
          className="rounded-md px-2 py-2 flex items-center hover:bg-gray-700 transition duration-300"
          style={{ textDecoration: "none" }}
        >
          <span
            className="self-center text-4xl font-semibold text-white"
            style={{ fontFamily: "Brush Script MT" }}
          >
            RoamWise
          </span>
        </Link>

        <div className="hidden sm:ml-6 sm:block">
          <div className="flex items-center space-x-4">
            <Link
              to="/templates"
              className="rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white"
            >
              Trips
            </Link>
            <Link
              to="/chatbot"
              className="rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white"
            >
              Planner
            </Link>

            <Link
              to="/expenses"
              className="rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white"
            >
              Expenses
            </Link>
            <Link
              to="/team"
              className="rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white"
            >
              Groups
            </Link>
            <Link
              to="/forum"
              className="rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white"
            >
              Forum
            </Link>
            {/* Tools Dropdown */}
            <div className="relative" ref={toolsDropdownRef}>
              <button
                onClick={() => setShowToolsDropdown(!showToolsDropdown)}
                className="rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white flex items-center gap-1"
              >
                <Settings className="w-5 h-5" />
                Tools
                <ChevronDown className="w-4 h-4" />
              </button>
              {showToolsDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-50">
                  <Link
                    to="/weather"
                    className="block px-4 py-2 text-black hover:bg-gray-100 transition text-lg"
                    onClick={() => setShowToolsDropdown(false)}
                  >
                    Weather ☁️
                  </Link>
                  <Link
                    to="/currency"
                    className="block px-4 py-2 text-black hover:bg-gray-100 transition text-lg"
                    onClick={() => setShowToolsDropdown(false)}
                  >
                    Currency Rate 💲
                  </Link>
                  <Link
                    to="/nearby"
                    className="block px-4 py-2 text-black hover:bg-gray-100 transition text-lg"
                    onClick={() => setShowToolsDropdown(false)}
                  >
                    Explore 📍
                  </Link>
                </div>
              )}
            </div>

            <Notification />

            {!user && (
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: 40 }}
              >
                <Link
                  to="/login"
                  className="rounded-md px-3 py-2 text-white text-lg font-medium hover:bg-gray-700 transition duration-300"
                >
                  Login
                </Link>
              </motion.div>
            )}

            {user && (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="rounded-md px-3 py-2 text-white text-lg font-medium hover:bg-gray-700 transition duration-300 flex items-center gap-2"
                >
                  <UserCircle className="w-5 h-5" />
                  <span className="hidden md:inline">Account</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-md overflow-hidden z-50">
                    <div className="py-1">
                      <button
                        onClick={handleProfileClick}
                        className="w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition text-lg flex items-center gap-2"
                      >
                        <UserIcon className="w-5 h-5" />
                        My Profile
                      </button>
                      <div className="border-t border-gray-200 mx-2"></div>
                      <button
                        onClick={forceLogout}
                        className="w-full text-left px-4 py-2 text-gray-800 hover:bg-red-100 transition text-lg flex items-center gap-2"
                      >
                        <LogOut className="w-5 h-5" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navigationbar);
