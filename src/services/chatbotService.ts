import { getDoc, updateDoc, doc ,collection, addDoc, serverTimestamp, deleteDoc, 
  getDocs,
  orderBy,
  query,} from "firebase/firestore";
import { auth, db } from "../components/firebase";

export type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  pic: string;
};

export type ChatMessage = {
  message: string;
  sender: "user" | "assistant";
  direction?: "incoming" | "outgoing";
};

export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
  const user = auth.currentUser;
  if (!user || !chatId) return [];

  try {
    const query = await getDoc(doc(db, "Users", user.uid, "chats", chatId));
    if (query.exists()) {
      return query.data().messages || [];
    }
    return [];
  } catch (error) {
    console.error("Error fetching messages: ", error);
    throw error;
  }
};

export const updateChatMessages = async (
  chatId: string,
  messages: ChatMessage[]
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !chatId) return;

  try {
    await updateDoc(doc(db, "Users", user.uid, "chats", chatId), {
      messages,
    });
  } catch (error) {
    console.error("Error updating messages: ", error);
    throw error;
  }
};

export const createNewChat = async (chatName: string): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user || !chatName.trim()) return null;

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
      chatName: chatName.trim(),
    });

    return docRef.id;
  } catch (error) {
    console.error("Error creating chat: ", error);
    throw error;
  }
};

export const deleteChatById = async (chatId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user || !chatId) return;

  try {
    await deleteDoc(doc(db, "Users", user.uid, "chats", chatId));
  } catch (error) {
    console.error("Error deleting chat: ", error);
    throw error;
  }
};

export const getAllChats = async (): Promise<any[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  try {
    const q = query(
      collection(db, "Users", user.uid, "chats"),
      orderBy("createdAt", "desc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching chat list: ", error);
    return [];
  }
};

export const getCurrentUserDetails = async (): Promise<UserDetails | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const docRef = doc(db, "Users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserDetails;
    } else {
      console.log("User document does not exist.");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};