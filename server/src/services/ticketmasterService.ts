import { geocodeCity } from "./weatherService";
import { encodeGeohash } from "../utils/geohash";

export interface RawLocalEvent {
  id: string;
  title: string;
  date: string; // dates.start.localDate
  venue?: string;
  city?: string;
  segment?: string; // classifications[0].segment.name
  genre?: string; // classifications[0].genre.name
  subGenre?: string; // classifications[0].subGenre.name
  url: string;
}

// Champ brut renvoyé par la Discovery API — juste ce qu'on lit, pas le
// schéma complet (beaucoup d'autres champs existent, non utilisés ici).
interface TicketmasterEventRaw {
  id?: string;
  name?: string;
  url?: string;
  dates?: { start?: { localDate?: string } };
  classifications?: {
    segment?: { name?: string };
    genre?: { name?: string };
    subGenre?: { name?: string };
  }[];
  _embedded?: {
    venues?: { name?: string; city?: { name?: string } }[];
  };
}

async function searchEvents(
  apiKey: string,
  geoParams: string,
): Promise<RawLocalEvent[] | null> {
  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${geoParams}&size=30&sort=date,asc&apikey=${apiKey}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const rawEvents: TicketmasterEventRaw[] = data._embedded?.events ?? [];

  // Validation défensive : on ne garde que les événements avec les champs
  // obligatoires pour l'affichage (titre, date, lien) — jamais d'événement
  // à moitié rempli affiché à l'utilisatrice.
  return rawEvents
    .filter(
      (e): e is TicketmasterEventRaw & {
        id: string;
        name: string;
        dates: { start: { localDate: string } };
        url: string;
      } =>
        typeof e.id === "string" &&
        typeof e.name === "string" &&
        typeof e.dates?.start?.localDate === "string" &&
        typeof e.url === "string",
    )
    .map((e) => {
      const classification = e.classifications?.[0];
      const venue = e._embedded?.venues?.[0];
      return {
        id: e.id,
        title: e.name,
        date: e.dates.start.localDate,
        venue: venue?.name,
        city: venue?.city?.name,
        segment: classification?.segment?.name,
        genre: classification?.genre?.name,
        subGenre: classification?.subGenre?.name,
        url: e.url,
      };
    });
}

// `city` seul (ancien comportement) ne permet aucun rayon — Ticketmaster
// exige `geoPoint` (geohash) pour une recherche par périmètre, `latlong`
// étant déprécié. On géocode donc la ville du profil (même clé OpenWeather,
// voir weatherService.geocodeCity) puis on encode en geohash. Si le
// géocodage échoue (clé absente, ville non reconnue...), on retombe sur une
// recherche par `city` plutôt que de ne rien renvoyer — toujours de vraies
// données, juste sans contrôle de rayon dans ce cas de repli.
//
// `radiusKm === null` : "pas de limite" côté interface. Attention, un
// `geoPoint` SANS `radius` ne veut pas dire "élargi mais toujours centré" —
// testé en direct : Ticketmaster ignore alors la position et renvoie son
// catalogue global (événements sans rapport, y compris très anciens). On
// utilise donc `countryCode` (déduit du géocodage) à la place : un vrai
// "n'importe où dans mon pays", sans plafond de distance arbitraire.
export async function fetchNearbyEvents(
  city: string,
  radiusKm: number | null,
): Promise<RawLocalEvent[] | null> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return null;

  const geo = await geocodeCity(city);
  if (geo) {
    if (radiusKm === null) {
      if (geo.country) {
        return searchEvents(apiKey, `countryCode=${geo.country}`);
      }
      // Pas de pays identifié (rare) : repli sur city plutôt que le
      // catalogue mondial non filtré.
      return searchEvents(apiKey, `city=${encodeURIComponent(city)}`);
    }
    const geohash = encodeGeohash(geo.lat, geo.lon);
    return searchEvents(
      apiKey,
      `geoPoint=${geohash}&radius=${radiusKm}&unit=km`,
    );
  }

  return searchEvents(apiKey, `city=${encodeURIComponent(city)}`);
}
