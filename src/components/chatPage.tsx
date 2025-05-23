import React, { useState, useEffect } from "react";
import SideBar from "./chatbotSidebar";
import ChatBot from "./chatbot";
import fetchChats from "../hooks/fetchChats";

const chatPage = () => {
  const [selectedChatID, setSelectedChatID] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(false);

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

  useEffect(() => {
    setPageLoading(true);
    setTimeout(() => {
      setPageLoading(false);
      setLoading(false);
    }, 1000);
  }, []);

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

  return (
    <div>
      <div className="flex flex-row">
        <div className="w-1/4">
          <SideBar
            selectedChatID={selectedChatID}
            setSelectedChatID={handleChatChange}
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

export default chatPage;
