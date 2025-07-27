import React, { useEffect, useState } from "react";

const ForumDateSection = ({ id, template }) => {
  const [startDate, setStartDate] = useState(template.startDate);
  const [endDate, setEndDate] = useState(template.endDate);

  // Update state if template dates change
  useEffect(() => {
    setStartDate(template.startDate);
    setEndDate(template.endDate);
  }, [template.startDate, template.endDate]);

  return (
    <div className="flex flex-col gap-6 bg-blue-50 rounded-xl p-6 shadow-sm border border-blue-200 mt-6">
      <h2 className="text-2xl font-semibold text-black">
        Plan Your Journey 🗓️
      </h2>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Start Date (read-only) */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-black mb-1">
            Start Date
          </label>
          <input
            disabled={true}
            type="date"
            value={startDate}
            className="disable w-full rounded-lg border border-blue-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
        {/* End Date (read-only) */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-black mb-1">
            End Date
          </label>
          <input
            disabled={true}
            type="date"
            value={endDate}
            className=" w-full rounded-lg border border-blue-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          />
        </div>
      </div>
    </div>
  );
};

export default ForumDateSection;
