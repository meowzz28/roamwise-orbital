import React from "react";
import { auth } from "./firebase";
import { useNavigate, Link } from "react-router-dom";
import { User } from "firebase/auth";

type Props = {
  user: User | null;
};

const Navigationbar = ({ user }: Props) => {
  const navigate = useNavigate();

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
    <nav className="bg-indigo-800 border-gray-200">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
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
              className="rounded-md px-3 py-2 text-white text-lg font-medium  hover:bg-gray-700"
            >
              Community Forum
            </Link>
            <Link
              to="/chatbot"
              className="rounded-md px-3 py-2 text-white text-lg font-medium  hover:bg-gray-700"
            >
              AI Assistant
            </Link>
            <Link
              to="/templates"
              className="rounded-md px-3 py-2 text-white text-lg font-medium  hover:bg-gray-700"
            >
              Trips
            </Link>
            <Link
              to="/expenses"
              className="rounded-md px-3 py-2 text-white text-lg font-medium  hover:bg-gray-700"
            >
              Expenses
            </Link>
            <Link
              to="/team"
              className="rounded-md px-3 py-2 text-white text-lg font-medium  hover:bg-gray-700"
            >
              Team
            </Link>
            <Link
              to="/profile"
              className="rounded-md px-3 py-2 text-white text-lg font-medium  hover:bg-gray-700"
            >
              Profile
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
              <ul className="dropdown-menu">
                <li>
                  <Link className="dropdown-item" to="/weather">
                    Weather ☁️
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/currency">
                    Currency 💲
                  </Link>
                </li>
              </ul>
            </div>

            {!user && (
              <Link
                to="/login"
                className="rounded-md px-3 py-2 text-white text-lg font-medium  hover:bg-gray-700"
              >
                Login
              </Link>
            )}
            {user && (
              <button className="btn btn-danger" onClick={forceLogout}>
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navigationbar);
