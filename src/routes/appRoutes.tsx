import { Routes, Route, useLocation } from "react-router-dom";
import Forum from "../components/Forum/forum";
import ViewPost from "../components/Forum/viewPost";
import CreatePost from "../components/Forum/createPost";
import Login from "../components/login";
import ResetPassword from "../components/resetPassword";
import SignUp from "../components/register";
import Profile from "../components/profile";
import Team from "../components/Team/index";
import Home from "../components/home";
import ChatPage from "../components/Chatbot/chatPage";
import { User } from "firebase/auth";
import EditPost from "../components/Forum/editPost";
import Templates from "../components/Template/templatesPage";
import Template from "../components/Template/template";
import ViewTeam from "../components/Team/viewTeam";
import Tracker from "../components/BudgetTracker/budgetMainPage";
import FloatingAIWidget from "../components/floatingAIWidget";
import CurrencyConverter from "../components/BudgetTracker/currencyConverter";
import Weather from "../components/Weather/weather";
import Nearby from "../components/NearbyPlaces/nearby";

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
            <Route path="/currency" element={<CurrencyConverter />} />
            <Route path="/weather" element={<Weather />} />
            <Route path="/viewTeam/:teamID" element={<ViewTeam />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/chatbot" element={<ChatPage />} />
            <Route path="/viewPost/:postId" element={<ViewPost />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/templates/:templateID" element={<Template />} />
            <Route path="/expenses" element={<Tracker />} />
            <Route path="/nearby" element={<Nearby />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default AppRoutes;
