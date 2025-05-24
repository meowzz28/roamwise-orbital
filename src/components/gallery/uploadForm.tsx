import React, { useState } from "react";
import { toast } from "react-toastify";
import ProgressBar from "./progressBar";

const uploadForm = () => {
  const [file, setFile] = useState<File | null>(null);
  const handleSubmit = (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (
      file &&
      (file.type === "image/png" ||
        file.type === "image/jpeg" ||
        file.type === "image.jpg")
    ) {
      setFile(file);
    } else {
      toast.error("Please upload a valid image file (PNG or JPEG).", {
        position: "bottom-center",
      });
      return;
    }
  };

  return (
    <div>
      <form className="flex flex-col items-center justify-center w-full h-full">
        <label className="text-lg font-semibold mb-2">
          <input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            className="text-sm text-stone-500 file:mr-5 file:py-1 file:px-3 file:border-[1px] file:text-xs file:font-medium file:bg-stone-5 file:text-stone-700 hover:file:cursor-pointer hover:file:bg-blue-50 hover:file:text-blue-700"
            onChange={handleSubmit}
          />
        </label>
        <div className="text-sm text-gray-500 mt-2">
          {file && <div> {file.name} </div>}
          {file && <ProgressBar file={file} setFile={setFile} />}
        </div>
      </form>
    </div>
  );
};

export default uploadForm;
