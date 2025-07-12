import React, { useState, useEffect } from "react";
import useAIResponse from "../hooks/useAIResponse";

const FloatingAIWidget = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [position, setPosition] = useState({
    x: window.innerWidth - 120,
    y: window.innerHeight - 120,
  });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  // Load saved chat messages from localStorage (persist session)
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("aiWidgetMessages");
    if (saved) return JSON.parse(saved);
    return [];
  });
  const { sendToAI, typing, error } = useAIResponse();

  // Capture initial mouse position and calculate offset for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    setHasDragged(false);
  };

  // Update widget position as mouse moves
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragging) return;
    const newX = e.clientX - offset.x;
    const newY = e.clientY - offset.y;
    if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
      setHasDragged(true);
    }
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  // Register mousemove and mouseup listeners globally for drag behavior
  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  // Persist chat messages to localStorage on update
  useEffect(() => {
    localStorage.setItem("aiWidgetMessages", JSON.stringify(messages));
  }, [messages]);

  // Send user message to AI and handle response
  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { message: input, sender: "user" }];
    setMessages(newMessages);
    setInput("");

    const res = await sendToAI(newMessages);
    if (res.success) {
      setMessages([
        ...newMessages,
        { message: res.reply, sender: "assistant" },
      ]);
    }
  };

  // Clear session (localStorage + state)
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem("aiWidgetMessages");
  };

  return (
    <div
      className="fixed z-50"
      style={{
        left: open ? `${position.x - 320 + 56}px` : `${position.x}px`,
        top: open ? `${position.y - 384 + 56}px` : `${position.y}px`,
      }}
    >
      {open ? (
        <div className="w-80 h-96 bg-white shadow-lg rounded-lg flex flex-col border border-gray-300">
          <div
            className="flex justify-between items-center px-4 py-2 bg-blue-600 text-white rounded-t-lg cursor-move"
            onMouseDown={handleMouseDown}
          >
            <span>RoamWise AI Assistant</span>
            <button onClick={() => setOpen(false)}>×</button>
          </div>
          <div className="flex-1 overflow-y-auto px-2 py-1 space-y-2 text-sm">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg max-w-[80%] ${
                  msg.sender === "user"
                    ? "bg-blue-100 self-end ml-auto"
                    : "bg-gray-200 self-start mr-auto"
                }`}
              >
                {msg.message}
              </div>
            ))}
            {typing && (
              <div className="text-gray-500 italic text-xs">
                Assistant is typing...
              </div>
            )}
          </div>
          <div className="p-2 border-t flex gap-1">
            <input
              className="flex-1 p-1 border rounded"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={typing}
              className="bg-blue-500 text-white px-3 py-1 rounded"
            >
              Send
            </button>
          </div>
          <button
            onClick={clearChat}
            className="text-xs text-red-500 hover:underline px-2 pb-2 text-right"
          >
            Clear session
          </button>
        </div>
      ) : (
        <button
          onMouseDown={handleMouseDown}
          onClick={() => {
            if (!hasDragged) setOpen(true);
          }}
          style={{ borderRadius: "9999px" }}
          className="bg-blue-500 text-white rounded-full w-14 h-14 shadow-lg text-2xl"
        >
          💬
        </button>
      )}
    </div>
  );
};

export default FloatingAIWidget;
