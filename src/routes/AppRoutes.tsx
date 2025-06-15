import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Forum from "../components/forum/forum";
import ViewPost from "../components/forum/viewPost";
import CreatePost from "../components/forum/createPost";
import Login from "../components/login";
import ResetPassword from "../components/resetPassword";
import SignUp from "../components/register";
import Profile from "../components/profile";
import Team from "../components/team/index";
import Home from "../components/home";
import ChatPage from "../components/chatbot/chatPage";
import { User } from "firebase/auth";
import EditPost from "../components/forum/editPost";
import Templates from "../components/template/templatesPage";
import Template from "../components/template/template";
import ViewTeam from "../components/team/viewTeam";
import Tracker from "../components/budgetTracker/BudgetMainPage";
import FloatingAIWidget from "../components/FloatingAIWidget";

type Props = {
  user: User | null;
};

function AppRoutes({ user }: Props) {
  const location = useLocation();
  const isAuthPage = ["/login", "/register"].includes(location.pathname);

  return (
    <div className="App">
      {user && <FloatingAIWidget />}

      <div className={isAuthPage ? "auth-wrapper" : "page-wrapper"}>
        <div className={isAuthPage ? "auth-inner" : ""}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/resetPassword" element={<ResetPassword />} />
            <Route path="/createPost" element={<CreatePost />} />
            <Route path="/editPost/:postId" element={<EditPost />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/team" element={<Team />} />
            <Route path="/viewTeam/:teamID" element={<ViewTeam />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chatbot" element={<ChatPage />} />
            <Route path="/viewPost/:postId" element={<ViewPost />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/:templateID" element={<Template />} />
            <Route path="/expenses" element={<Tracker />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default AppRoutes;
