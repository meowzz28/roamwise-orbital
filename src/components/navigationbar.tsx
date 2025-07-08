import React from "react";
import { auth } from "./firebase";
import { useNavigate, Link } from "react-router-dom";
import { User } from "firebase/auth";
import { motion } from "framer-motion";

type Props = {
  user: User | null;
};

const Navigationbar = ({ user }: Props) => {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = React.useState(false);

  const forceLogout = async () => {
    try {
      await auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      navigate("/login");
    } catch (error) {
      console.error("Error forcefully logging out:", error.message);
    }
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 shadow-md border-b border-gray-300">
      {" "}
      <div
        className={`w-full sm:flex sm:items-center ${
          showMenu ? "block" : "hidden"
        }`}
      ></div>
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4 ">
        <Link
          to="/"
          className="rounded-md px-3 py-2 flex items-center hover:bg-gray-700"
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
          <div className="flex space-x-4">
            <Link
              to="/forum"
              className="rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white"
            >
              Forum
            </Link>
            <Link
              to="/chatbot"
              className="rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white"
            >
              Smart Planner
            </Link>
            <Link
              to="/templates"
              className="rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white"
            >
              My Trips
            </Link>
            <Link
              to="/expenses"
              className="rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white"
            >
              Trip Expenses
            </Link>
            <Link
              to="/team"
              className="rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white"
            >
              Travel Buddies
            </Link>
            <Link
              to="/profile"
              className="rounded-md px-3 py-2 text-white text-lg font-medium border-b-4 border-transparent transition duration-300 ease-in-out hover:border-white"
            >
              My Profile
            </Link>

            <div className="nav-item dropdown">
              <a
                className="hover:bg-gray-700 text-lg font-medium rounded-md  sunderline nav-link dropdown-toggle text-white text-lg"
                href="#"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <u>Toolkit</u>
              </a>
              <ul className="dropdown-menu bg-white text-gray-800 shadow-lg rounded-md overflow-hidden">
                <li>
                  <Link
                    className="dropdown-item px-4 py-2 hover:bg-indigo-100 transition"
                    to="/weather"
                  >
                    Weather ☁️
                  </Link>
                </li>
                <li>
                  <Link
                    className="dropdown-item px-4 py-2 hover:bg-indigo-100 transition"
                    to="/currency"
                  >
                    Currency 💲
                  </Link>
                </li>
                <li>
                  <Link
                    className="dropdown-item px-4 py-2 hover:bg-indigo-100 transition"
                    to="/nearby"
                  >
                    Explore 📍
                  </Link>
                </li>
              </ul>
            </div>

            {!user && (
              <motion.div
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 2, repeat: 40 }}
              >
                <Link
                  to="/login"
                  className="relative top-2 rounded-md px-3 py-2 text-white text-lg font-medium  hover:bg-gray-700"
                >
                  Login
                </Link>
              </motion.div>
            )}
            {user && (
              <button
                className="btn btn-danger"
                style={{ borderRadius: "5px" }}
                onClick={forceLogout}
              >
                <span className="  font-medium  text-lg">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navigationbar);
