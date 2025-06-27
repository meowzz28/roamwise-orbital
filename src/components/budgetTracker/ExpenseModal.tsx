import React, { useState } from "react";
import { auth, db, storage } from "../firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  addDoc,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { motion } from "framer-motion";

const allCurrencies = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "$" },
  { code: "AED", name: "United Arab Emirates Dirham", symbol: "د.إ" },
  { code: "AFN", name: "Afghan Afghani", symbol: "؋" },
  { code: "ALL", name: "Albanian Lek", symbol: "L" },
  { code: "AMD", name: "Armenian Dram", symbol: "֏" },
  { code: "ANG", name: "Netherlands Antillean Guilder", symbol: "ƒ" },
  { code: "AOA", name: "Angolan Kwanza", symbol: "Kz" },
  { code: "ARS", name: "Argentine Peso", symbol: "$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "AWG", name: "Aruban Florin", symbol: "ƒ" },
  { code: "AZN", name: "Azerbaijani Manat", symbol: "₼" },
  { code: "BAM", name: "Bosnia-Herzegovina Convertible Mark", symbol: "KM" },
  { code: "BBD", name: "Barbadian Dollar", symbol: "Bds$" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳" },
  { code: "BGN", name: "Bulgarian Lev", symbol: "лв" },
  { code: "BHD", name: "Bahraini Dinar", symbol: ".د.ب" },
  { code: "BIF", name: "Burundian Franc", symbol: "FBu" },
  { code: "BMD", name: "Bermudian Dollar", symbol: "$" },
  { code: "BND", name: "Brunei Dollar", symbol: "B$" },
  { code: "BOB", name: "Bolivian Boliviano", symbol: "Bs." },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "BSD", name: "Bahamian Dollar", symbol: "$" },
  { code: "BTN", name: "Bhutanese Ngultrum", symbol: "Nu." },
  { code: "BWP", name: "Botswana Pula", symbol: "P" },
  { code: "BYN", name: "Belarusian Ruble", symbol: "Br" },
  { code: "BZD", name: "Belize Dollar", symbol: "BZ$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CDF", name: "Congolese Franc", symbol: "FC" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CLP", name: "Chilean Peso", symbol: "$" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "COP", name: "Colombian Peso", symbol: "$" },
  { code: "CRC", name: "Costa Rican Colón", symbol: "₡" },
  { code: "CUP", name: "Cuban Peso", symbol: "$" },
  { code: "CVE", name: "Cape Verdean Escudo", symbol: "$" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "DJF", name: "Djiboutian Franc", symbol: "Fdj" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "DOP", name: "Dominican Peso", symbol: "RD$" },
  { code: "DZD", name: "Algerian Dinar", symbol: "دج" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£" },
  { code: "ERN", name: "Eritrean Nakfa", symbol: "Nfk" },
  { code: "ETB", name: "Ethiopian Birr", symbol: "Br" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "FJD", name: "Fijian Dollar", symbol: "FJ$" },
  { code: "FKP", name: "Falkland Islands Pound", symbol: "£" },
  { code: "FOK", name: "Faroese Króna", symbol: "kr" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "GEL", name: "Georgian Lari", symbol: "₾" },
  { code: "GGP", name: "Guernsey Pound", symbol: "£" },
  { code: "GHS", name: "Ghanaian Cedi", symbol: "₵" },
  { code: "GIP", name: "Gibraltar Pound", symbol: "£" },
  { code: "GMD", name: "Gambian Dalasi", symbol: "D" },
  { code: "GNF", name: "Guinean Franc", symbol: "FG" },
  { code: "GTQ", name: "Guatemalan Quetzal", symbol: "Q" },
  { code: "GYD", name: "Guyanese Dollar", symbol: "G$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "HNL", name: "Honduran Lempira", symbol: "L" },
  { code: "HRK", name: "Croatian Kuna", symbol: "kn" },
  { code: "HTG", name: "Haitian Gourde", symbol: "G" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪" },
  { code: "IMP", name: "Isle of Man Pound", symbol: "£" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "IQD", name: "Iraqi Dinar", symbol: "ع.د" },
  { code: "IRR", name: "Iranian Rial", symbol: "﷼" },
  { code: "ISK", name: "Icelandic Króna", symbol: "kr" },
  { code: "JEP", name: "Jersey Pound", symbol: "£" },
  { code: "JMD", name: "Jamaican Dollar", symbol: "J$" },
  { code: "JOD", name: "Jordanian Dinar", symbol: "د.ا" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "KGS", name: "Kyrgyzstani Som", symbol: "сом" },
  { code: "KHR", name: "Cambodian Riel", symbol: "៛" },
  { code: "KID", name: "Kiribati Dollar", symbol: "$" },
  { code: "KMF", name: "Comorian Franc", symbol: "CF" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "KWD", name: "Kuwaiti Dinar", symbol: "د.ك" },
  { code: "KYD", name: "Cayman Islands Dollar", symbol: "CI$" },
  { code: "KZT", name: "Kazakhstani Tenge", symbol: "₸" },
  { code: "LAK", name: "Lao Kip", symbol: "₭" },
  { code: "LBP", name: "Lebanese Pound", symbol: "ل.ل" },
  { code: "LKR", name: "Sri Lankan Rupee", symbol: "Rs" },
  { code: "LRD", name: "Liberian Dollar", symbol: "L$" },
  { code: "LSL", name: "Lesotho Loti", symbol: "L" },
  { code: "LYD", name: "Libyan Dinar", symbol: "ل.د" },
  { code: "MAD", name: "Moroccan Dirham", symbol: "د.م." },
  { code: "MDL", name: "Moldovan Leu", symbol: "L" },
  { code: "MGA", name: "Malagasy Ariary", symbol: "Ar" },
  { code: "MKD", name: "Macedonian Denar", symbol: "ден" },
  { code: "MMK", name: "Myanmar Kyat", symbol: "K" },
  { code: "MNT", name: "Mongolian Tögrög", symbol: "₮" },
  { code: "MOP", name: "Macanese Pataca", symbol: "P" },
  { code: "MRU", name: "Mauritanian Ouguiya", symbol: "UM" },
  { code: "MUR", name: "Mauritian Rupee", symbol: "₨" },
  { code: "MVR", name: "Maldivian Rufiyaa", symbol: "ރ." },
  { code: "MWK", name: "Malawian Kwacha", symbol: "MK" },
  { code: "MXN", name: "Mexican Peso", symbol: "$" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM" },
  { code: "MZN", name: "Mozambican Metical", symbol: "MT" },
  { code: "NAD", name: "Namibian Dollar", symbol: "N$" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "NIO", name: "Nicaraguan Córdoba", symbol: "C$" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "NPR", name: "Nepalese Rupee", symbol: "₨" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "OMR", name: "Omani Rial", symbol: "ر.ع." },
  { code: "PAB", name: "Panamanian Balboa", symbol: "B/." },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/." },
  { code: "PGK", name: "Papua New Guinean Kina", symbol: "K" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨" },
  { code: "PLN", name: "Polish Złoty", symbol: "zł" },
  { code: "PYG", name: "Paraguayan Guarani", symbol: "₲" },
  { code: "QAR", name: "Qatari Riyal", symbol: "﷼" },
  { code: "RON", name: "Romanian Leu", symbol: "lei" },
  { code: "RSD", name: "Serbian Dinar", symbol: "дин" },
  { code: "RUB", name: "Russian Ruble", symbol: "₽" },
  { code: "RWF", name: "Rwandan Franc", symbol: "FRw" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼" },
  { code: "SBD", name: "Solomon Islands Dollar", symbol: "SI$" },
  { code: "SCR", name: "Seychellois Rupee", symbol: "₨" },
  { code: "SDG", name: "Sudanese Pound", symbol: "£" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "SHP", name: "Saint Helena Pound", symbol: "£" },
  { code: "SLE", name: "Sierra Leonean Leone", symbol: "Le" },
  { code: "SLL", name: "Sierra Leonean Leone", symbol: "Le" },
  { code: "SOS", name: "Somali Shilling", symbol: "Sh" },
  { code: "SRD", name: "Surinamese Dollar", symbol: "$" },
  { code: "SSP", name: "South Sudanese Pound", symbol: "£" },
  { code: "STN", name: "São Tomé and Príncipe Dobra", symbol: "Db" },
  { code: "SYP", name: "Syrian Pound", symbol: "£" },
  { code: "SZL", name: "Swazi Lilangeni", symbol: "L" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "TJS", name: "Tajikistan Somoni", symbol: "ЅМ" },
  { code: "TMT", name: "Turkmenistani Manat", symbol: "m" },
  { code: "TND", name: "Tunisian Dinar", symbol: "د.ت" },
  { code: "TOP", name: "Tongan Paʻanga", symbol: "T$" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "TTD", name: "Trinidad and Tobago Dollar", symbol: "TT$" },
  { code: "TVD", name: "Tuvaluan Dollar", symbol: "$" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "UAH", name: "Ukrainian Hryvnia", symbol: "₴" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "UYU", name: "Uruguayan Peso", symbol: "$U" },
  { code: "UZS", name: "Uzbekistan Som", symbol: "so'm" },
  { code: "VES", name: "Venezuelan Bolívar", symbol: "Bs." },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫" },
  { code: "VUV", name: "Vanuatu Vatu", symbol: "VT" },
  { code: "WST", name: "Samoan Tala", symbol: "WS$" },
  { code: "XAF", name: "Central African CFA Franc", symbol: "FCFA" },
  { code: "XCD", name: "East Caribbean Dollar", symbol: "EC$" },
  { code: "XDR", name: "Special Drawing Rights", symbol: "SDR" },
  { code: "XOF", name: "West African CFA Franc", symbol: "CFA" },
  { code: "XPF", name: "CFP Franc", symbol: "₣" },
  { code: "YER", name: "Yemeni Rial", symbol: "﷼" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "ZMW", name: "Zambian Kwacha", symbol: "ZK" },
  { code: "ZWL", name: "Zimbabwean Dollar", symbol: "Z$" },
];
type Props = {
  setIsCreating: React.Dispatch<React.SetStateAction<boolean>>;
  isCreating: boolean;
  onClose: () => void;
  tripId: string;
};

const ExpenseModal: React.FC<Props> = ({
  setIsCreating,
  isCreating,
  onClose,
  tripId,
}) => {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("");
  const [totalSpending, setTotalSpending] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [currencySearch, setCurrencySearch] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    if (!category) {
      toast.error("Please select a category.", {
        position: "bottom-center",
      });
      return;
    }
    if (!tripId) {
      toast.error("Please select a trip before adding expenses.", {
        position: "bottom-center",
      });
      return;
    }

    setIsCreating(true);

    try {
      const toastId = toast.loading("Adding expenses", {
        position: "bottom-center",
      });

      await addDoc(collection(db, "Expenses"), {
        userId: user.uid,
        tripId: tripId,
        category: category,
        description: description,
        date: date,
        currency: currency,
        totalSpending: totalSpending,
      });

      toast.update(toastId, {
        render: `Successfully added expenses!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
        position: "bottom-center",
      });
    } catch (error: any) {
      toast.error(error, {
        position: "bottom-center",
      });
    } finally {
      setIsCreating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="relative p-4 w-full max-w-md max-h-full"
      >
        <div className="bg-white rounded-lg shadow">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Add New Expense
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:bg-gray-200 hover:text-gray-900 rounded-lg w-8 h-8 flex justify-center items-center"
            >
              <svg
                className="w-3 h-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7L1 13"
                />
              </svg>
            </button>
          </div>

          <form className="p-4" onSubmit={handleSubmit}>
            <div className="mb-4 relative">
              <label
                htmlFor="category"
                className="block mb-2 text-sm font-medium text-gray-900"
              >
                Category
              </label>
              <button
                type="button"
                style={{ borderRadius: "8px" }}
                onClick={() => setShowDropdown((prev) => !prev)}
                className="w-full p-2.5 text-sm rounded-lg border border-gray-300 text-left bg-white flex justify-between items-center"
              >
                {category
                  ? category.charAt(0).toUpperCase() + category.slice(1)
                  : "Select Category"}
                <svg
                  className="w-4 h-4 ml-2 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {showDropdown && (
                <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-md">
                  {["transport", "food", "accomodation", "others"].map(
                    (item) => (
                      <li
                        key={item}
                        onClick={() => {
                          setCategory(item);
                          setShowDropdown(false);
                        }}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                      >
                        {item.charAt(0).toUpperCase() + item.slice(1)}
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>

            <div className="mb-4">
              <label
                htmlFor="description"
                className="block mb-2 text-sm font-medium text-gray-900"
              >
                Description
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 text-sm rounded-lg border border-gray-300"
                placeholder="e.g. Airplane Ticket"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="spending"
                className="block mb-2 text-sm font-medium text-gray-900"
              >
                Total Spending
              </label>

              <div className="relative flex gap-2 items-center">
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setShowCurrencyDropdown((prev) => !prev)}
                    style={{ borderRadius: "8px" }}
                    className="p-2.5 pr-8 text-sm  w-40 rounded-lg border border-gray-300 bg-white min-w-fit text-left"
                  >
                    {allCurrencies.find((c) => c.code === currency)?.symbol}{" "}
                    {currency}
                  </button>
                  <div className="pointer-events-none absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500">
                    ▼
                  </div>

                  {showCurrencyDropdown && (
                    <div className="absolute z-30 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-md">
                      <input
                        type="text"
                        value={currencySearch}
                        onChange={(e) => setCurrencySearch(e.target.value)}
                        placeholder="Search currency..."
                        className="w-full p-2 text-sm border-b border-gray-200 focus:outline-none"
                      />
                      <ul className="max-h-60 overflow-y-auto">
                        {allCurrencies
                          .filter((curr) =>
                            `${curr.code} ${curr.name}`
                              .toLowerCase()
                              .includes(currencySearch.toLowerCase())
                          )
                          .map((curr) => (
                            <li
                              key={curr.code}
                              onClick={() => {
                                setCurrency(curr.code);
                                setShowCurrencyDropdown(false);
                                setCurrencySearch("");
                              }}
                              className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                            >
                              {curr.symbol} {curr.code} — {curr.name}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  id="spending"
                  min="0"
                  step="0.01"
                  onChange={(e) => setTotalSpending(Number(e.target.value))}
                  className="w-full p-2.5 text-sm rounded-lg border border-gray-300"
                  placeholder="e.g. 1200.00"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="date"
                className="block mb-2 text-sm font-medium text-gray-900"
              >
                Date
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 text-sm rounded-lg border border-gray-300"
                placeholder="e.g. Airplane Ticket"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 d-flex justify-content-center align-items-center"
              disabled={isCreating}
            >
              {isCreating && (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
              )}
              {isCreating ? "Adding..." : "Add Expenses"}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ExpenseModal;
