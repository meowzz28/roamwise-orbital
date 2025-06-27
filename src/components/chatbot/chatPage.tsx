import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import SideBar from "./chatbotSidebar";
import ChatBot from "./chatbot";
import fetchChats from "../../hooks/fetchChats";

type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  pic: string;
};

const ChatPage = () => {
  const navigate = useNavigate();
  const [selectedChatID, setSelectedChatID] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(false);

  useEffect(() => {
    setPageLoading(true);
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "Users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserDetails(docSnap.data() as UserDetails);
          } else {
            console.log("User document does not exist.");
          }
        } catch (err: any) {
          console.error("Error fetching user data:", err.message);
        }
      } else {
        setUserDetails(null);
      }
      setPageLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleChatChange = (chatId: string | null) => {
    if (selectedChatID !== chatId) {
      setLoading(true);

      setSelectedChatID(null);

      setTimeout(() => {
        setSelectedChatID(chatId);
        setLoading(false);
      }, 50);
    }
  };

  // useEffect(() => {
  //   setPageLoading(true);
  //   setTimeout(() => {
  //     setPageLoading(false);
  //     setLoading(false);
  //   }, 1500);
  // }, []);

  if (pageLoading) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading...</p>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="container text-center p-5">
        <p className="text-danger">User not logged in or user data missing.</p>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/login")}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="container bg-white 200 p-5 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-4 border-dark border-bottom">
        <h1 className="text-2xl font-bold ">Smart Planner 🤖</h1>
      </div>
      <div className="flex flex-row">
        <div className="w-1/4">
          <SideBar
            selectedChatID={selectedChatID}
            setSelectedChatID={handleChatChange}
            setPageLoading={setPageLoading}
          />
        </div>
        <div className="w-3/4">
          {loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Loading...
            </div>
          ) : (
            <ChatBot selectedChatID={selectedChatID} />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
