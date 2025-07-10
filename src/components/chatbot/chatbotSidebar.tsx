import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { toast } from "react-toastify";
import fetchChats from "../../hooks/fetchChats";
import ChatNameModal from "./ChatNameModal";

type ChatMessage = {
  message: string;
  sender: "user" | "assistant";
  direction?: "incoming" | "outgoing";
};

const chatbotSidebar = ({
  selectedChatID,
  setSelectedChatID,
  setPageLoading,
}) => {
  const [chats, setChats] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const openModal = () => {
    setName("");
    setShowModal(true);
  };

  const handleCreateChat = async () => {
    const user = auth.currentUser;
    if (!user || !name.trim()) return;
    setPageLoading(true);
    try {
      const docRef = await addDoc(collection(db, "Users", user.uid, "chats"), {
        messages: [
          {
            message:
              "RoamWise your travel planning assistant. Please state where you want to go, the date and how many days you want to travel.",
            sender: "assistant",
            direction: "incoming",
          },
        ],
        userID: user.uid,
        createdAt: serverTimestamp(),
        chatName: name,
      });

      await fetchChats(setChats);
      setSelectedChatID(docRef.id);
      toast.success("New chat initialized", { position: "bottom-center" });
    } catch (error) {
      console.error("Error initializing chat: ", error);
    } finally {
      setShowModal(false);
      setPageLoading(false);
    }
  };

  const deleteChat = async (chatID: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const user = auth.currentUser;
    if (!user) return;

    try {
      await deleteDoc(doc(db, "Users", user.uid, "chats", chatID));
      const updatedChats = chats.filter((chat) => chat.id !== chatID);
      setChats(updatedChats);
      if (selectedChatID === chatID) {
        setSelectedChatID(null);
      }
    } catch (error) {
      console.error("Error deleting chat: ", error);
    }
  };

  useEffect(() => {
    fetchChats(setChats);
  }, []);

  return (
    <div
      className="mb-2 p-4 bg-gray-800 rounded-lg "
      style={{ height: "500px" }}
    >
      <button
        className="text-white bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2"
        onClick={openModal}
        style={{ borderRadius: "8px" }}
      >
        {" "}
        New Chat{" "}
      </button>
      {showModal && (
        <ChatNameModal
          onClose={() => setShowModal(false)}
          setName={setName}
          name={name}
          handleCreateChat={handleCreateChat}
        />
      )}
      <div
        className="overflow-y-auto h-96 bg-gray-600"
        style={{ height: "calc(100% - 50px)" }}
      >
        {chats.map((chat, index) => (
          <div
            key={chat.id}
            onClick={() => setSelectedChatID(chat.id)}
            className={`cursor-pointer py-2 hover:bg-gray-200 text-white bg-blue-700 rounded-lg m-2 p-2 ${
              selectedChatID === chat.id ? "border-2 border-white" : ""
            }`}
          >
            {chat.chatName}
            <button
              onClick={(e) => deleteChat(chat.id, e)}
              className="text-red-500 hover:text-red-700 text-align-right float-right"
            >
              X
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default chatbotSidebar;
