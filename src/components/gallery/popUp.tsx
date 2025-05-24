import React from "react";
import { motion } from "framer-motion";

const popUp = ({ setSelectedImg, selectedImg }) => {
  const handleClick = (e) => {
    if (e.target === e.currentTarget) {
      setSelectedImg(null);
    }
  };

  return (
    <motion.div
      className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50"
      onClick={handleClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.img
        src={selectedImg}
        alt="enlarged pic"
        initial={{ y: "-100vh" }}
        animate={{ y: 0 }}
        className="block max-w-[60%] max-h-[80%] mt-[60px] mx-auto shadow-[3px_5px_7px_rgba(0,0,0,0.5)] border-[3px] border-white"
      />
    </motion.div>
  );
};

export default popUp;
