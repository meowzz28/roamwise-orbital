import React, { useRef, useState, useEffect } from "react";
import { auth } from "../firebase";
import ChatMessage from "./chatMessage";
import DateSeparator from "../Team/dateSeparator";
import {
  UserDetails,
  Message,
  getCurrentUserDetails,
  sendMsg,
  fetchMsg,
} from "../../services/teamService";

function Chat({ teamID }: { teamID: string }) {
  const dummy = useRef<HTMLDivElement>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [formValue, setFormValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  // Load authenticated user's details and listen to messages
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userData = await getCurrentUserDetails();
          setUserDetails(userData);
        } catch (err: any) {
          console.error("Error fetching user data:", err.message);
        }
      } else {
        setUserDetails(null);
      }
      setAuthChecked(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!teamID) return;
    const unsubscribe = fetchMsg(teamID, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [teamID]);

  // Handle sending a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);

    const { uid } = auth.currentUser || {};
    if (!uid || !teamID) return;

    setFormValue("");
    await sendMsg(
      formValue.trim(),
      teamID,
      uid,
      userDetails ? `${userDetails.firstName}`.trim() : "Unknown User"
    );

    setFormValue("");
    setIsSending(false);
    dummy.current?.scrollIntoView({ behavior: "auto" });
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh] border rounded-2xl shadow-md bg-white">
      {/* Message list */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.length == 0 ? (
          <div className="text-center text-gray-400 mt-10">
            No chat to preview
          </div>
        ) : (
          (() => {
            let lastDate = "";
            return messages.map((msg) => {
              const messageDate = msg.createdAt
                ? new Date(msg.createdAt.seconds * 1000)
                : null;
              if (!messageDate) return null;
              const formattedDate = messageDate.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              });

              const showDate = formattedDate !== lastDate;
              lastDate = formattedDate;

              return (
                <React.Fragment key={msg.id}>
                  {showDate && <DateSeparator date={formattedDate} />}
                  <ChatMessage message={msg} />
                </React.Fragment>
              );
            });
          })()
        )}
        <div ref={dummy}></div>
      </div>

      {/* Chat input form */}
      <form onSubmit={sendMessage} className="flex p-4 border-t">
        <input
          value={formValue}
          disabled={isSending}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder={isSending ? "Sending..." : "Type a message..."}
          className={`form-control me-2 rounded ${
            isSending ? "bg-light text-muted" : ""
          }`}
        />

        <button
          type="submit"
          disabled={!formValue || isSending}
          className="bg-blue-500 text-white px-2 rounded-r hover:bg-blue-600 disabled:bg-gray-300"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
