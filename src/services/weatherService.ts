export interface WeatherData {
  temp_c: number;
  condition: {
    text: string;
    icon: string;
  };
  locationName: string;
}

export async function fetchWeather(loc: string): Promise<WeatherData> {
  const API_KEY = import.meta.env.VITE_API_KEY_WEATHER;
  const API_URL = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${loc}`;

  const response = await fetch(API_URL);
  if (!response.ok) {
    if (response.status === 400) {
      throw new Error("Please enter a valid location.");
    } else {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
  }

  const data = await response.json();
  return {
    temp_c: data.current.temp_c,
    condition: {
      text: data.current.condition.text,
      icon: data.current.condition.icon,
    },
    locationName: data.location.name,
  };
}