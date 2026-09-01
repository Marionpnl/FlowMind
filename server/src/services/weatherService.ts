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

export interface GeoPoint {
  lat: number;
  lon: number;
}

// Géocodage (ville → coordonnées) via l'API Geocoding d'OpenWeatherMap — même
// clé que la météo, même fournisseur, pas besoin d'une deuxième clé. Utilisé
// par ticketmasterService pour une recherche d'événements par rayon (city
// seul ne permet pas de rayon, voir ticketmasterService.ts).
export async function geocodeCity(city: string): Promise<GeoPoint | null> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) return null;

  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const first = data[0];
  if (typeof first?.lat !== "number" || typeof first?.lon !== "number") {
    return null;
  }

  return { lat: first.lat, lon: first.lon };
}
