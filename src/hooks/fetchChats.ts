import React from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { auth, db } from "../components/firebase";


const fetchChats = async (setChats) => {
    
    const user = auth.currentUser;
    if (!user) return;
    try {
        
      const q = query(
        collection(db, "Users", user.uid, "chats"),
        orderBy("createdAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const chats = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        message: doc.data().messages[0].message,
        createdAt: doc.data().createdAt,
        chatName: doc.data().chatName
      }));

      setChats(chats);
     
    } catch (error) {
      console.error("Error fetching chats: ", error);
    }
  };

  export default fetchChats;