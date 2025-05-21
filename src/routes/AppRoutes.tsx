import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "../components/login";
import SignUp from "../components/register";
import Profile from "../components/profile";
import Navbar from "../components/navigationbar";
import Home from "../components/home";
import ChatPage from "../components/chatPage";
import { User } from "firebase/auth";

type Props = {
  user: User | null;
};

function AppRoutes({ user }: Props) {
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  return (
    <div className="App">
      <Navbar />

      <div className={isAuthPage ? "auth-wrapper" : "page-wrapper"}>
        <div className={isAuthPage ? "auth-inner" : ""}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<SignUp />} />
            <Route
              path="/profile"
              element={user ? <Profile /> : <Navigate to="/login" />}
            />
            <Route
              path="/chatbot"
              element={user ? <ChatPage /> : <Navigate to="/login" />}
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default AppRoutes;
