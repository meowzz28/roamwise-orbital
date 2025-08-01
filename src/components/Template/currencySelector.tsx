import React, { useState } from "react";
import {
  allCurrencies,
  CurrencySelectorProps,
} from "../../services/templateService";

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selected,
  onSelect,
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");

  // Find full currency details based on selected currency code
  const selectedCurrency = allCurrencies.find((c) => c.code === selected);

  return (
    <div className="relative w-full">
      {/* Main selector button */}
      <button
        type="button"
        style={{ borderRadius: "8px" }}
        onClick={() => setShowDropdown((prev) => !prev)}
        className="w-full p-2 border border-gray-300 rounded-lg bg-gray-50 text-left text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {/* Display selected currency info */}
        {selectedCurrency?.symbol} {selectedCurrency?.code} —{" "}
        {selectedCurrency?.name}
      </button>
      {/* Dropdown list with filter input */}
      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 ounded-lg max-h-72 overflow-y-auto">
          {/* Search input inside dropdown */}
          <input
            type="text"
            className="w-full p-2 border-b border-gray-200 text-sm focus:outline-none"
            placeholder="Search currency..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {/* Filtered list of currencies based on search term */}
          <ul className="max-h-60 overflow-y-auto text-sm">
            {allCurrencies
              .filter((curr) =>
                `${curr.code} ${curr.name}`
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
              .map((curr) => (
                <li
                  key={curr.code}
                  onClick={() => {
                    onSelect(curr.code);
                    setShowDropdown(false);
                    setSearch("");
                  }}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  {curr.symbol} {curr.code} — {curr.name}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
