interface CurrentWeather {
  temperature: number;
  condition: string;
}

// Traductions FR des descriptions météo OpenWeather les plus courantes
const CONDITION_LABELS: Record<string, string> = {
  Clear: "ensoleillé",
  Clouds: "nuageux",
  Rain: "pluvieux",
  Drizzle: "bruine",
  Thunderstorm: "orageux",
  Snow: "neigeux",
  Mist: "brumeux",
  Fog: "brumeux",
  Haze: "brumeux",
};

export async function fetchCurrentWeather(
  city: string,
): Promise<CurrentWeather | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const main = data.weather?.[0]?.main;
  if (typeof data.main?.temp !== "number" || !main) return null;

  return {
    temperature: Math.round(data.main.temp),
    condition: CONDITION_LABELS[main] || main.toLowerCase(),
  };
}
