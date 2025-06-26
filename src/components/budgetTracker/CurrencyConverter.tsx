import { useEffect, useState, ChangeEvent } from "react";
import CurrencySelect from "./CurrencySelect";

const CurrencyConverter = () => {
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("SGD");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Swap the values of fromCurrency and toCurrency
  const handleSwapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Function to fetch the exchange rate and update the result
  const getExchangeRate = async () => {
    const API_KEY = import.meta.env.VITE_API_KEY_CURRENCY;
    const API_URL = `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${fromCurrency}/${toCurrency}`;
    if (isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw Error("Something went wrong!");
      const data = await response.json();
      const rate = (data.conversion_rate * amount).toFixed(2);
      setResult(`${amount} ${fromCurrency} = ${rate} ${toCurrency}`);
    } catch (error) {
      setResult("Something went wrong!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    getExchangeRate();
  };

  // Fetch exchange rate on initial render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // Fetch on initial render
  useEffect(() => {
    getExchangeRate();
  }, []);
  return (
    <div className="flex justify-center items-center w-full">
      <div className="bg-shadow border rounded-2xl">
        <form className="p-3 rounded " onSubmit={handleFormSubmit}>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-800 text-center">
            Live Currency Exchange Rate💲
          </h1>
          {/* Horizontal input section */}
          <div className="d-flex flex-wrap gap-3 ">
            {/* Amount input */}
            <div className="form-group">
              <label htmlFor="amount" className="form-label">
                Amount
              </label>
              <input
                id="amount"
                type="number"
                className="form-control"
                value={amount}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setAmount(Number(e.target.value))
                }
                required
              />
            </div>

            {/* From Currency */}
            <div className=" form-group">
              <label className="form-label">From</label>
              <CurrencySelect
                selectedCurrency={fromCurrency}
                handleCurrency={(e) => setFromCurrency(e.target.value)}
              />
            </div>

            {/* Swap Icon */}
            <div
              className="d-flex align-items-center justify-content-center p-2 cursor-pointer"
              onClick={handleSwapCurrencies}
              title="Swap Currencies"
              style={{ cursor: "pointer" }}
            >
              <svg
                width="20"
                viewBox="0 0 20 19"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19.13 11.66H.22a.22.22 0 0 0-.22.22v1.62a.22.22 0 0 0 .22.22h16.45l-3.92 4.94a.22.22 0 0 0 .17.35h1.97c.13 0 .25-.06.33-.16l4.59-5.78a.9.9 0 0 0-.7-1.43zM19.78 5.29H3.34L7.26.35A.22.22 0 0 0 7.09 0H5.12a.22.22 0 0 0-.34.16L.19 5.94a.9.9 0 0 0 .68 1.4H19.78a.22.22 0 0 0 .22-.22V5.51a.22.22 0 0 0-.22-.22z"
                  fill="#000"
                />
              </svg>
            </div>

            {/* To Currency */}
            <div className="form-group">
              <label className="form-label">To</label>
              <CurrencySelect
                selectedCurrency={toCurrency}
                handleCurrency={(e) => setToCurrency(e.target.value)}
              />
            </div>
          </div>

          {/* Result */}
          <div className="mt-1">
            <strong>{isLoading ? "Fetching exchange rate..." : result}</strong>
          </div>

          <div className="mt-1">
            <button
              type="submit"
              className={`btn btn-primary ${isLoading ? "disabled" : ""}`}
            >
              {isLoading ? "Converting..." : "Get Exchange Rate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CurrencyConverter;
