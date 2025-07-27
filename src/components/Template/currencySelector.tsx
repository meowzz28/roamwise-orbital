import React, { useState } from "react";

export const allCurrencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "AED", name: "United Arab Emirates Dirham", symbol: "د.إ" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "ARS", name: "Argentine Peso", symbol: "$" },
  { code: "CLP", name: "Chilean Peso", symbol: "$" },
  { code: "COP", name: "Colombian Peso", symbol: "$" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA" },
];

type CurrencySelectorProps = {
  selected: string;
  onSelect: (currencyCode: string) => void;
};

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
