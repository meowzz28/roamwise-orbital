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
  const [resizing, setResizing] = useState(false);
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({
    width: 0,
    height: 0,
  });
  const [resizeDirection, setResizeDirection] = useState("");
  const [size, setSize] = useState({ width: 320, height: 384 });

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

    const topLeftX = open ? position.x - size.width + 56 : position.x;
    const topLeftY = open ? position.y - size.height + 56 : position.y;

    setOffset({
      x: e.clientX - topLeftX,
      y: e.clientY - topLeftY,
    });

    setHasDragged(false);
  };

  const handleResizeStart = (e, direction) => {
    e.stopPropagation();
    setResizing(true);
    setResizeDirection(direction);
    setResizeStartPos({ x: e.clientX, y: e.clientY });
    setResizeStartSize({ width: size.width, height: size.height });
  };

  // Update widget position as mouse moves
  const handleMouseMove = (e) => {
    if (dragging && !resizing) {
      const newLeft = e.clientX - offset.x;
      const newTop = e.clientY - offset.y;

      const maxX = window.innerWidth - (open ? size.width : 56);
      const maxY = window.innerHeight - (open ? size.height : 56);

      const clampedLeft = Math.max(0, Math.min(newLeft, maxX));
      const clampedTop = Math.max(0, Math.min(newTop, maxY));

      const newX = open ? clampedLeft + size.width - 56 : clampedLeft;
      const newY = open ? clampedTop + size.height - 56 : clampedTop;

      if (Math.abs(newX - position.x) > 5 || Math.abs(newY - position.y) > 5) {
        setHasDragged(true);
      }

      setPosition({ x: newX, y: newY });
    }
    if (resizing) {
      const deltaX = e.clientX - resizeStartPos.x;
      const deltaY = e.clientY - resizeStartPos.y;

      // Calculate new size with minimum constraints
      let newWidth = resizeStartSize.width;
      let newHeight = resizeStartSize.height;
      let newX = position.x;
      let newY = position.y;

      if (resizeDirection.includes("left")) {
        newWidth = Math.max(280, resizeStartSize.width - deltaX);
      }
      if (resizeDirection.includes("top")) {
        newHeight = Math.max(300, resizeStartSize.height - deltaY);
      }

      setSize({ width: newWidth, height: newHeight });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
    setResizing(false);
    setResizeDirection("");
  };

  // Register mousemove and mouseup listeners globally
  useEffect(() => {
    if (dragging || resizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [
    dragging,
    resizing,
    offset,
    position,
    size,
    resizeStartPos,
    resizeStartSize,
    resizeDirection,
  ]);

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
        left: open ? `${position.x - size.width + 56}px` : `${position.x}px`,
        top: open ? `${position.y - size.height + 56}px` : `${position.y}px`,
      }}
    >
      {open ? (
        <div
          className=" bg-white shadow-lg rounded-lg flex flex-col border border-gray-300"
          style={{ width: size.width, height: size.height }}
        >
          <div
            className="flex justify-between items-center px-4 py-2 bg-blue-600 text-white rounded-t-lg cursor-move"
            onMouseDown={handleMouseDown}
          >
            <span>RoamWise AI Assistant</span>
            <button onClick={() => setOpen(false)}>×</button>
          </div>
          <div
            onMouseDown={(e) => handleResizeStart(e, "top")}
            className="absolute top-0 left-2 right-2 h-2 cursor-n-resize hover:bg-blue-200/30 transition-colors"
          />
          <div
            onMouseDown={(e) => handleResizeStart(e, "top-left")}
            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
          />
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
