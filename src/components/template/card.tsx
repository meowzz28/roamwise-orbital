import React from "react";
import { Link } from "react-router-dom";

const Card = ({ topic, templateID, imageURL }) => {
  return (
    <div className="w-80 h-84 flex-shrink-0 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <img
        className="w-full h-40 object-cover rounded-t-lg"
        src={imageURL}
        alt="RoamWise"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = "/RoamWise.jpg";
        }}
      />
      <div className="h-[1px] bg-black mx-4" />
      <div className="p-4 flex flex-col justify-between h-44">
        <h1 className="text-xl font-bold text-center text-gray-900  leading-relaxed truncate py-1">
          {topic}
        </h1>
        <div className="flex justify-center mt-4">
          <Link
            to={`/templates/${templateID}`}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600"
          >
            Edit Trip
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Card;
