import React, { useEffect, useState } from "react";
import { uploadImageToGallery } from "../../services/galleryService";

const progressBar = ({ file, setFile }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!file) return;

    uploadImageToGallery(
      file,
      setProgress,
      (url) => {
        setFile(null);
      },
      (error) => {
        console.error("Upload failed:", error.message);
        setFile(null);
      }
    );
  }, [file, setFile]);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div
        className="bg-blue-600 h-2.5 rounded-full "
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default progressBar;
