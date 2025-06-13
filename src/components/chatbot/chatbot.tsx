import React, { useState, useEffect } from "react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import { getDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import useAIResponse from "../../hooks/useAIResponse";

type ChatMessage = {
  message: string;
  sender: "user" | "assistant";
  direction?: "incoming" | "outgoing";
};

const chatbot = ({ selectedChatID }) => {
  // const systemPrompt =
  //   "You are a friendly travel planning assistant. You can help users plan their trips, suggest destinations, help generate travel itineraries based on preferences, and budget." +
  //   "You can also help in comparing prices and calculating budget. You can also provide recommendation on what to bring on their trip based on weather and season for users" +
  //   " You do not reply to questions not related to travel no matter what. For generating travel itineraries, reply in this format (eg Bangkok Trip): " +
  //   " Day 1 – Cultural Exploration & River Cruise " +
  //   " Morning: Grand Palace & Wat Phra Kaew (Temple of the Emerald Buddha) ⏱ 8:30 AM – 11:00 AM 📍 Rattanakosin Island 💡 Dress modestly – no shorts or sleeveless tops." +
  //   " Late Morning: Wat Pho (Reclining Buddha) ⏱ 11:15 AM – 12:15 PM 💆 Optional: Traditional Thai massage in the temple complex";
  // const apiKey = import.meta.env.VITE_API_KEY_OPENAI;
  const { sendToAI, typing, error } = useAIResponse();
  // const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMessages = async () => {
    setIsLoading(true);
    setMessages([]);
    const user = auth.currentUser;
    if (!user || !selectedChatID) {
      setIsLoading(false);
      return;
    }

    try {
      const query = await getDoc(
        doc(db, "Users", user.uid, "chats", selectedChatID)
      );
      if (query.exists()) {
        setMessages(query.data().messages || []);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedChatID) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [selectedChatID]);

  const updateFireStore = async (updatedMessages: ChatMessage[]) => {
    const user = auth.currentUser;
    if (!user || !selectedChatID) return;
    try {
      await updateDoc(doc(db, "Users", user.uid, "chats", selectedChatID), {
        messages: updatedMessages,
      });
    } catch (error) {
      console.error("Error updating Firestore: ", error);
    }
  };

  const handleSend = async (message: string) => {
    const newMessage: ChatMessage = {
      message: message,
      sender: "user",
      direction: "outgoing",
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    const res = await sendToAI(newMessages);
    if (res.success) {
      const assistantMessage: ChatMessage = {
        message: res.reply,
        sender: "assistant",
        direction: "incoming",
      };
      const finalMessages = [...newMessages, assistantMessage];
      setMessages(finalMessages);
      await updateFireStore(finalMessages);
    } else {
      const errorMessage: ChatMessage = {
        message: "Sorry, something went wrong. Please try again.",
        sender: "assistant",
        direction: "incoming",
      };
      setMessages([...newMessages, errorMessage]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Loading chat...
      </div>
    );
  }

  if (!selectedChatID) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Select or create a chat to begin.
      </div>
    );
  }

  return (
    <div>
      <div style={{ position: "relative", height: "500px", width: "100%" }}>
        <MainContainer>
          <ChatContainer>
            <MessageList
              scrollBehavior="smooth"
              typingIndicator={
                typing ? (
                  <TypingIndicator content="RoamWise is thinking..." />
                ) : null
              }
            >
              {messages.map((message, i) => {
                return <Message key={i} model={message} />;
              })}
            </MessageList>
            <MessageInput placeholder="Type message here" onSend={handleSend} />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
};

export default chatbot;
