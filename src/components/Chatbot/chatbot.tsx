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
import useAIResponse from "../../hooks/useAIResponse";
import {
  getChatMessages,
  updateChatMessages,
  ChatMessage,
} from "../../services/chatbotService";

const chatbot = ({ selectedChatID }) => {
  // Custom hook for AI response and typing state
  const { sendToAI, typing, error } = useAIResponse();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      setMessages([]);
      try {
        if (selectedChatID) {
          const msgs = await getChatMessages(selectedChatID);
          setMessages(msgs);
        }
      } catch {
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [selectedChatID]);

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
      await updateChatMessages(selectedChatID, finalMessages);
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
