import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { fetchWeather, WeatherData } from "../../services/weatherService";

function Weather() {
  const [location, setLocation] = useState("");
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const detectLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        setLocation(data.city);
        await searchWeather(data.city);
      } catch (err) {
        console.error("Auto-detect failed");
      }
    };
    detectLocation();
  }, []);

  const searchWeather = async (loc: string) => {
    setIsSearching(true);
    setWeatherData(null);
    try {
      const weather = await fetchWeather(loc);
      setWeatherData(weather);
    } catch (error: any) {
      toast.error(error.message, { position: "bottom-center" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchWeather(location);
  };

  if (isSearching) {
    return (
      <div className="container text-center p-5">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="group border p-5 rounded-2xl ">
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

      {weatherData ? (
        <div>
          <h3>Result:</h3>
          <div className="border container">
            <div className="p-2 d-flex flex-column align-items-center text-center">
              <h5>{weatherData.locationName}</h5>
              <img src={weatherData.condition.icon} alt="Weather Icon" />
              <p className="fs-5">
                {weatherData.temp_c}°C - {weatherData.condition.text}
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
