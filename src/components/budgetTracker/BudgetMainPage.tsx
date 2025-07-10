import React, { useState, useEffect } from "react";
import { auth, db, storage } from "../firebase";
import {
  doc,
  onSnapshot,
  getDoc,
  query,
  collection,
  where,
  orderBy,
} from "firebase/firestore";
import ExpenseModal from "./ExpenseModal";
import { useNavigate } from "react-router-dom";
import DonutChart from "./DonutChart";
import ExpensesList from "./ExpensesList";
import CurrencyConverter from "./CurrencyConverter";

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

type UserDetails = {
  email: string;
  firstName: string;
  lastName: string;
  pic: string;
};

type Expenses = {
  id: string;
  category: string;
  currency: string;
  date: string;
  description: string;
  totalSpending: number;
  userId: string;
  tripId: string;
};

type Template = {
  id: string;
  topic: string;
};

const BudgetMainPage = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [userUID, setUserUID] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [isFetching, setIsFetching] = useState(false);
  const [currency, setCurrency] = useState("");
  const [originalExpenses, setOriginalExpenses] = useState<Expenses[]>([]);
  const [convertedExpenses, setConvertedExpenses] = useState<Expenses[]>([]);

  useEffect(() => {
    let unsubscribeTemplates: (() => void) | null = null;
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserUID(user.uid);
        try {
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          if (userDoc.exists()) {
            setUserDetails(userDoc.data() as UserDetails);
          }

          const q = query(
            collection(db, "Templates"),
            where("userUIDs", "array-contains", user.uid)
          );

          unsubscribeTemplates = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => ({
              id: doc.id,
              topic: doc.data().topic,
            }));
            setTemplates(data);
          });
        } catch (err: any) {
          console.error("Error fetching user or templates:", err.message);
        }
      } else {
        setUserDetails(null);
      }
      setAuthChecked(true);
    });
    return () => {
      unsubscribeAuth();
      if (unsubscribeTemplates) unsubscribeTemplates();
    };
  }, []);

  useEffect(() => {
    if (!selectedTripId || !userUID || !currency) return;
    setIsFetching(true);

    const q = query(
      collection(db, "Expenses"),
      where("userId", "==", userUID),
      where("tripId", "==", selectedTripId),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data = querySnapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Expenses)
        );
        // console.log("Fetched expenses:", data);
        setOriginalExpenses(data);
        setConvertedExpenses(data);
        setIsFetching(false);
      },
      (error) => {
        console.error("Error fetching expenses:", error.message);
        setIsFetching(false);
      }
    );
    return () => unsubscribe();
  }, [selectedTripId, userUID, currency]);

  const getDistinctCurrencies = (expenses: Expenses[]) => {
    const currencies = expenses.map((expense) => expense.currency);
    const uniqueCurrencies = Array.from(new Set(currencies));
    return uniqueCurrencies;
  };

  useEffect(() => {
    const convertExpenses = async () => {
      if (!currency || currency === "") {
        setConvertedExpenses(originalExpenses);
        return;
      }

      const distinctCurrencies = getDistinctCurrencies(originalExpenses).filter(
        (curr) => curr !== currency
      );

      const API_KEY = import.meta.env.VITE_API_KEY_CURRENCY;
      const rateMap: Record<string, number> = {};

      for (const from of distinctCurrencies) {
        try {
          const response = await fetch(
            `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${from}/${currency}`
          );
          if (!response.ok) throw Error("Something went wrong!");
          const data = await response.json();
          rateMap[from] = data.conversion_rate;
        } catch (err) {
          console.error(`Error fetching rate for ${from} → ${currency}`);
          rateMap[from] = 1; // fallback
        }
      }

      // Convert expenses
      const newExpenses = originalExpenses.map((exp) => {
        if (exp.currency === currency) return exp;
        const rate = rateMap[exp.currency] ?? 1;
        return {
          ...exp,
          totalSpending: exp.totalSpending * rate,
          currency,
        };
      });

      setConvertedExpenses(newExpenses);
    };

    convertExpenses();
  }, [currency, originalExpenses]);

  if (!authChecked) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading...</p>
      </div>
    );
  }

  if (!userDetails) {
    return (
      <div className="container text-center p-5">
        <p className="text-danger">User not logged in or user data missing.</p>
        <button
          className="btn btn-primary mt-3"
          onClick={() => navigate("/login")}
        >
          Go to Login
        </button>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="container text-center p-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Fetching expenses...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8">
      {!selectedTripId || !currency ? (
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1 space-y-6">
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-800 text-center">
                Budget & Expense Tracker 💵
              </h1>
              <div className="mb-4">
                <label className="block mb-2 font-medium text-gray-700">
                  Select a Trip:
                </label>
                <select
                  data-testid="select-template"
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                >
                  <option value="">-- Choose a trip --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.topic}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <label className="block mb-2 font-medium text-gray-700">
                  Select a Display Currency:
                </label>
                <div>
                  <select
                    data-testid="select-currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                  >
                    <option value="">-- Choose a currency --</option>
                    {allCurrencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code + ": " + curr.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-6">
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6  h-[400px]">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-800 text-center">
                Budget & Expense Tracker 💵
              </h1>
              <div className="mb-1">
                <label className="block mb-2 font-medium text-gray-700">
                  Select a Trip:
                </label>
                <select
                  data-testid="select-template"
                  value={selectedTripId}
                  onChange={(e) => setSelectedTripId(e.target.value)}
                  className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                >
                  <option value="">-- Choose a trip --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.topic}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-2">
                  <label className="block mb-2 font-medium text-gray-700">
                    Select a Display Currency:
                  </label>
                  <div>
                    <select
                      data-testid="select-currency"
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="border border-gray-300 rounded-lg px-4 py-2 w-full"
                    >
                      <option value="">-- Choose a currency --</option>
                      {allCurrencies.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code + ": " + curr.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  style={{ borderRadius: "8px" }}
                  className="w-full mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition text-white text-sm font-medium px-6 py-3 shadow-md"
                  onClick={() => setShowModal(true)}
                >
                  + Add Expense
                </button>
              </div>
            </div>

            <div className="flex-1 bg-white shadow-sm rounded-2xl border border-gray-100 p-6">
              <DonutChart expenses={convertedExpenses} />
            </div>
          </div>

          {/* Right Column: Expenses List */}

          <div className="flex-1 space-y-6">
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-6  h-[400px]">
              <CurrencyConverter />
            </div>
            <ExpensesList expenses={convertedExpenses} />
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedTripId && (
        <ExpenseModal
          setIsCreating={setIsCreating}
          isCreating={isCreating}
          onClose={() => setShowModal(false)}
          tripId={selectedTripId}
        />
      )}
    </div>
  );
};

export default BudgetMainPage;
