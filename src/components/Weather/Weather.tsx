import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

function Weather() {
  const [location, setLocation] = useState("");
  const [result, setResult] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [temp, setTemp] = useState(0);
  const [city, setCity] = useState("");
  const [icon, setIcon] = useState("");

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        console.log(data);
        const detectedCity = data.country_capital;
        await setLocation(detectedCity);
        fetchWeather(detectedCity);
      } catch (err) {
        console.error("Auto-detect failed");
      }
    };
    detectLocation();
  }, []);

  const fetchWeather = async (loc: string) => {
    setIsSearching(true);
    setResult("");
    const API_KEY = import.meta.env.VITE_API_KEY_WEATHER;
    try {
      const API_URL = `http://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${loc}`;
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          toast.error("Please enter a valid location.", {
            position: "bottom-center",
          });
          throw new Error("Bad Request: Please enter a valid location.");
        } else {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
      }

      setTemp(data.current.temp_c);
      setResult(data.current.condition.text);
      setIcon(data.current.condition.icon);
      setCity(data.location.name);
    } catch (error) {
      setResult("");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeather(location);
  };

  if (isSearching) {
    return (
      <div className="container text-center p-5">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-800 text-center">
        Live Weather ☁️
      </h1>
      <form onSubmit={handleSearch} className="mb-3">
        <div className="row align-items-end">
          <div className="col-md-9">
            <h3 className="form-label">Location:</h3>
            <input
              type="text"
              id="location"
              className="form-control"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              placeholder="Enter city or location"
            />
          </div>
          <div className="col-md-3 text-end pt-2">
            <button
              type="submit"
              className="btn btn-outline-primary mt-2"
              disabled={isSearching}
            >
              <img
                width={30}
                src="/Search.png"
                alt="Search"
                style={{ marginRight: "5px" }}
              />
              {isSearching ? "Loading..." : "Search"}
            </button>
          </div>
        </div>
      </form>

      {result ? (
        <div>
          <h3>Result: </h3>
          <div className="border container">
            <div className=" p-2 d-flex flex-column align-items-center text-center">
              <h5>{city}</h5>
              <img src={icon} alt="Weather Icon" />
              <p className="fs-5">
                {temp}°C - {result}
              </p>
            </div>
          </div>
        </div>
      ) : (
        !isSearching && (
          <div className="text-center text-muted">No data yet</div>
        )
      )}
    </div>
  );
}

export default Weather;
