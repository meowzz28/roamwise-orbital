import { Link } from "react-router-dom";

const TeamCard = ({ teamName, teamID }) => {
  return (
    <div className="w-80 h-60 flex-shrink-0 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
      <div className="p-4 flex flex-col justify-between">
        <h1 className="text-xl font-bold text-center text-gray-900 truncate">
          {teamName}
        </h1>
        <div className="flex justify-center mt-4">
          <Link
            to={`/viewTeam/${teamID}`}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-700 rounded-lg hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-600"
          >
            View Team
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TeamCard;
