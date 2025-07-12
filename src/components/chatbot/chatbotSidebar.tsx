import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
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
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Open modal to create a new chat
  const openModal = () => {
    setName("");
    setShowModal(true);
  };

  // Create a new chat in Firestore
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

  const confirmDeleteChat = (chatID: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chatID);
    setIsDeleteConfirmOpen(true);
  };

  // Delete a chat from Firestore
  const deleteChat = async () => {
    if (!chatToDelete) return;
    const user = auth.currentUser;
    if (!user) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "Users", user.uid, "chats", chatToDelete));
      const updatedChats = chats.filter((chat) => chat.id !== chatToDelete);
      setChats(updatedChats);
      if (selectedChatID === chatToDelete) {
        setSelectedChatID(null);
      }
      toast.success("Chat deleted.");
    } catch (error) {
      console.error("Error deleting chat: ", error);
      toast.error("Failed to delete chat.");
    } finally {
      setIsDeleting(false);
      setIsDeleteConfirmOpen(false);
      setChatToDelete(null);
    }
  };

  // Fetch chat list on mount
  useEffect(() => {
    fetchChats(setChats);
  }, []);

  return (
    <div
      className="p-4 bg-white shadow-lg rounded-xl h-full flex flex-col border border-blue-200"
      style={{ height: "500px" }}
    >
      {/* Button to open modal for new chat */}
      <div className="mb-4">
        <div className="text-center mb-2">
          <h2 className="text-black font-semibold text-lg">Your Chats</h2>
        </div>
        <button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg shadow"
          style={{ borderRadius: "8px" }}
          onClick={openModal}
        >
          + New Chat
        </button>
      </div>

      {/* Modal for entering chat name */}
      {showModal && (
        <ChatNameModal
          onClose={() => setShowModal(false)}
          setName={setName}
          name={name}
          handleCreateChat={handleCreateChat}
        />
      )}
      {/* List of chats */}
      <div
        className="overflow-y-auto flex-1 space-y-2 pr-1"
        style={{ height: "calc(100% - 50px)" }}
      >
        {chats.map((chat, index) => (
          <div
            key={chat.id}
            onClick={() => setSelectedChatID(chat.id)}
            className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors ${
              selectedChatID === chat.id
                ? "bg-blue-100 border border-blue-400"
                : "bg-gray-50 hover:bg-blue-50"
            }`}
          >
            <span className="text-sm text-gray-800 font-medium truncate">
              {chat.chatName}
            </span>
            {/* Delete chat button */}
            <button
              onClick={(e) => confirmDeleteChat(chat.id, e)}
              className="text-red-500 hover:text-red-700 text-align-right float-right"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsDeleteConfirmOpen(false)}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl z-50">
            <h3 className="text-lg text-red-600 font-semibold mb-2">
              Delete this chat?
            </h3>
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete this chat? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={deleteChat}
                className="btn btn-danger"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>
                ) : null}
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default chatbotSidebar;
