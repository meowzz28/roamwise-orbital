import React, { useRef, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  doc,
  collection,
  getDoc,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

type Message = {
  id: string;
  text: string;
  uid: string;
  createdAt: {
    seconds: number;
    nanoseconds: number;
  };
  createdBy: string;
  user_name: string;
};
type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  pic: string;
};

function Chat({ teamID }: { teamID: string }) {
  const dummy = useRef<HTMLDivElement>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [formValue, setFormValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
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

      setAuthChecked(true);
    });

    let unsubscribeMessages: (() => void) | null = null;

    const messagesQuery = query(
      collection(db, "Messages"),
      where("teamID", "==", teamID)
    );

    if (teamID) {
      const messagesQuery = query(
        collection(db, "Messages"),
        where("teamID", "==", teamID)
      );

      unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];

        msgs.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return a.createdAt.seconds - b.createdAt.seconds;
        });

        console.log("Fetched messages:", msgs);
        setMessages(msgs);
      });
    }

    return () => {
      unsubscribe();
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, [teamID]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    const { uid } = auth.currentUser || {};

    if (!uid || !teamID) return;

    await addDoc(collection(db, "Messages"), {
      text: formValue.trim(),
      createdAt: serverTimestamp(),
      teamID: teamID,
      createdBy: uid,
      user_name: userDetails
        ? `${userDetails.firstName}`.trim()
        : "Unknown User",
    });

    setFormValue("");
    setIsSending(false);
    dummy.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg shadow-md bg-white">
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={dummy}></div>
      </div>

      <form onSubmit={sendMessage} className="flex p-4 border-t">
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-l focus:outline-none"
        />

        <button
          type="submit"
          disabled={!formValue || isSending}
          className="bg-blue-500 text-white px-4 rounded-r hover:bg-blue-600 disabled:bg-gray-300"
        >
          Send
        </button>
      </form>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const { text, createdBy, user_name, createdAt } = message;
  const currentUser = auth.currentUser;
  const isSentByCurrentUser = currentUser?.uid === createdBy;
  const timeString = createdAt
    ? new Date(createdAt.seconds * 1000).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
  return (
    <div
      className={`flex ${
        isSentByCurrentUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`rounded-lg px-4 py-2 max-w-xs break-words ${
          isSentByCurrentUser
            ? "bg-blue-500 text-white"
            : "bg-gray-200 text-gray-800"
        }`}
      >
        <div className="d-flex align-items-center">
          <div className="bg-light rounded-circle p-2 me-2 text-primary fw-bold">
            {(user_name?.charAt(0) || "?").toUpperCase()}{" "}
          </div>
          <span>{user_name}</span>
          <div className="text-end text-xs ml-2"> {timeString}</div>
        </div>
        {text}
      </div>
    </div>
  );
}

export default Chat;
