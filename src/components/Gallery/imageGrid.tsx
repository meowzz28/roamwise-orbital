import React from "react";
import { useState, useEffect } from "react";
import { storage, auth, db } from "../firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { motion } from "framer-motion";

const imageGrid = ({ setSelectedImg }) => {
  const [docs, setDocs] = useState<any[]>([]);

  // Function to delete image from Firestore and Storage
  const deleteImage = (id: string, url: string) => async () => {
    const user = auth.currentUser;
    if (!user) return;
    try {
      // Delete Firestore document
      await deleteDoc(doc(db, "Users", user.uid, "images", id));
      // Delete image from Firebase Storage
      await deleteObject(ref(storage, url));
    } catch (error: any) {
      console.error("Error deleting image:", error.message);
    }
  };

  // Realtime listener for user's uploaded images
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "Users", user.uid, "images"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let docs: any[] = [];
      snapshot.forEach((doc) => {
        docs.push({ ...doc.data(), id: doc.id });
      });
      setDocs(docs);
    });
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {docs &&
        docs.map((doc) => (
          <motion.div
            key={doc.id}
            className="relative rounded overflow-hidden aspect-[4/3] shadow-md group"
            layout
            whileHover={{ opacity: 1 }}
            onClick={() => setSelectedImg(doc.url)}
          >
            <img
              src={doc.url}
              alt="uploaded pic"
              className="w-full h-full object-contain"
            />
            <button
              className="absolute top-2 right-2 text-black text-xs hover:text-red-500 bg-transparent "
              onClick={(e) => {
                e.stopPropagation();
                deleteImage(doc.id, doc.url)();
              }}
            >
              X
            </button>
          </motion.div>
        ))}
    </div>
  );
};

export default imageGrid;
