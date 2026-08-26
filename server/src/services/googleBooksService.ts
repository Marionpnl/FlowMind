export async function fetchBookPurchaseLink(
  title: string,
  author?: string,
): Promise<string | null> {
  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  if (!apiKey) return null;

  // Le "+" entre intitle:/inauthor: est la syntaxe AND de l'API — il doit
  // rester littéral dans l'URL, donc chaque valeur est encodée séparément
  // plutôt que la requête entière (un encodeURIComponent global transforme
  // ce "+" en "%2B", que Google interprète comme un caractère du texte
  // recherché plutôt que comme un séparateur).
  const titleTerm = `intitle:${encodeURIComponent(title)}`;
  const authorTerm = author ? `+inauthor:${encodeURIComponent(author)}` : "";
  const url = `https://www.googleapis.com/books/v1/volumes?q=${titleTerm}${authorTerm}&maxResults=1&key=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  const volume = data.items?.[0]?.volumeInfo;
  if (!volume) return null;

  // `canonicalVolumeLink`/`infoLink` mènent toujours à la fiche du livre sur
  // Google Books (aperçu, avis, liens vers les libraires) — pas besoin du
  // `buyLink` de `saleInfo`, absent pour beaucoup de livres non vendus par
  // Google directement.
  return volume.canonicalVolumeLink || volume.infoLink || null;
}
