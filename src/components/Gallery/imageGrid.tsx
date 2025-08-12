import React from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  deleteImageById,
  listenToUserImages,
} from "../../services/galleryService";

const imageGrid = ({ setSelectedImg }) => {
  const [docs, setDocs] = useState<any[]>([]);

  // Function to delete image from Firestore and Storage
  const deleteImage = (id: string, url: string) => async () => {
    try {
      await deleteImageById(id, url);
    } catch (error: any) {
      console.error("Error deleting image:", error.message);
    }
  };

  // Realtime listener for user's uploaded images
  useEffect(() => {
    const unsubscribe = listenToUserImages(setDocs);
    return unsubscribe; // cleanup
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
