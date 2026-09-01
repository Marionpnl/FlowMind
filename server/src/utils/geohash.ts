// Encodage geohash standard (base32) — nécessaire pour le paramètre
// `geoPoint` de l'API Ticketmaster (son ancien paramètre `latlong` est
// déprécié). Algorithme classique : on affine en alternance l'intervalle de
// longitude puis de latitude par dichotomie, 5 bits par caractère base32.
const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

export function encodeGeohash(
  lat: number,
  lon: number,
  precision = 7,
): string {
  let latRange: [number, number] = [-90, 90];
  let lonRange: [number, number] = [-180, 180];
  let isEven = true;
  let bit = 0;
  let charIndex = 0;
  let hash = "";

  while (hash.length < precision) {
    if (isEven) {
      const mid = (lonRange[0] + lonRange[1]) / 2;
      if (lon >= mid) {
        charIndex = (charIndex << 1) + 1;
        lonRange = [mid, lonRange[1]];
      } else {
        charIndex = charIndex << 1;
        lonRange = [lonRange[0], mid];
      }
    } else {
      const mid = (latRange[0] + latRange[1]) / 2;
      if (lat >= mid) {
        charIndex = (charIndex << 1) + 1;
        latRange = [mid, latRange[1]];
      } else {
        charIndex = charIndex << 1;
        latRange = [latRange[0], mid];
      }
    }
    isEven = !isEven;

    if (bit < 4) {
      bit++;
    } else {
      hash += BASE32[charIndex];
      bit = 0;
      charIndex = 0;
    }
  }

  return hash;
}
