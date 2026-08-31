import type { RawLocalEvent } from "../services/ticketmasterService";

interface InterestKeywords {
  name: string;
  category?: string;
}

// Filtre déterministe, pas d'IA : chaque événement Ticketmaster porte déjà sa
// propre classification réelle (segment/genre/sous-genre) — comparer ces
// mots-clés à ceux des centres d'intérêt est un simple filtre, pas un
// problème qui a besoin de raisonnement génératif. Même esprit que le Mode
// Redécouverte de MindShelf : gratuit, prévisible, zéro risque d'halluciner.
export function scoreEventsByInterests(
  events: RawLocalEvent[],
  interests: InterestKeywords[],
): RawLocalEvent[] {
  if (interests.length === 0) {
    return [...events].sort((a, b) => a.date.localeCompare(b.date));
  }

  const keywords = interests
    .flatMap((i) => [i.name, i.category])
    .filter((k): k is string => Boolean(k))
    .map((k) => k.toLowerCase());

  function score(event: RawLocalEvent): number {
    const haystack = [event.segment, event.genre, event.subGenre]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!haystack) return 0;
    return keywords.filter((k) => haystack.includes(k)).length;
  }

  return [...events].sort((a, b) => {
    const scoreDiff = score(b) - score(a);
    if (scoreDiff !== 0) return scoreDiff;
    return a.date.localeCompare(b.date);
  });
}
