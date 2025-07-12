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
import ChatMessage from "./ChatMessage";

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

  // Track auth state and fetch user profile
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

    // Set up real-time listener for messages
    let unsubscribeMessages: (() => void) | null = null;

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

        //console.log("Fetched messages:", msgs);
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

  // Send message to Firestore
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
    dummy.current?.scrollIntoView({ behavior: "auto" });
  };

  return (
    <div className="flex flex-col h-full border rounded-lg shadow-md bg-white">
      {/* Chat messages */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.length == 0 ? (
          <div className="text-center text-gray-400 mt-10">
            No chat to preview
          </div>
        ) : (
          messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
        )}
        <div ref={dummy}></div>
      </div>

      {/* Input box */}
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

export default Chat;
