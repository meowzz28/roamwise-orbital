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
  // Custom hook for AI response and typing state
  const { sendToAI, typing, error } = useAIResponse();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load messages from Firestore for the selected chat
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

  // Reload messages when selectedChatID changes
  useEffect(() => {
    if (selectedChatID) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [selectedChatID]);

  // Update Firestore with new messages
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

  // Handle sending a new message
  const handleSend = async (message: string) => {
    const newMessage: ChatMessage = {
      message: message,
      sender: "user",
      direction: "outgoing",
    };
    const newMessages = [...messages, newMessage];
    setMessages(newMessages);
    // Send to AI and handle response
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

  // Main chat UI
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
