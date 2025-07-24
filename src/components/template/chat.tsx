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
import ChatMessage from "./TripChat";
import DateSeparator from "./dateSeparator";

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

  // Load authenticated user's details and listen to messages
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

    if (teamID) {
      // Real-time listener for team-specific messages
      const messagesQuery = query(
        collection(db, "Messages"),
        where("teamID", "==", teamID)
      );

      unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
        const msgs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];

        // Sort messages by creation timestamp
        msgs.sort((a, b) => {
          if (!a.createdAt || !b.createdAt) return 0;
          return a.createdAt.seconds - b.createdAt.seconds;
        });

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

  // Handle sending a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    const { uid } = auth.currentUser || {};

    if (!uid || !teamID) return;
    console.log("!23");
    await addDoc(collection(db, "Messages"), {
      text: formValue.trim(),
      createdAt: serverTimestamp(),
      teamID: teamID,
      createdBy: uid,
      user_name: userDetails
        ? `${userDetails.firstName}`.trim()
        : "Unknown User",
    });

    //Notification
    const teamRef = doc(db, "Team", teamID);
    const teamSnap = await getDoc(teamRef);
    const teamData = teamSnap.data();
    if (teamSnap.exists()) {
      const teamData = teamSnap.data();
      const memberUIDs: string[] = teamData.user_uid || [];
      console.log("Member UIDs in team:", memberUIDs);

      const currentUser = auth.currentUser;
      const senderUID = currentUser?.uid;
      const senderName = userDetails ? userDetails.firstName : "Unknown User";
      const notifyPromises = memberUIDs
        .filter((uid) => uid !== senderUID)
        .map((uid) =>
          addDoc(collection(db, "Notifications"), {
            userId: uid,
            trigger: senderUID,
            message: `${senderName} sent a message in .${teamData.Name}`,
            Time: serverTimestamp(),
            read: false,
          })
        );
      await Promise.all(notifyPromises);
    }

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
