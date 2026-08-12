interface OpenLibraryBook {
  title: string;
  author?: string;
  coverUrl?: string;
  isbn?: string;
}

export async function fetchBookByISBN(
  isbn: string,
): Promise<OpenLibraryBook | null> {
  const cleanIsbn = isbn.replace(/[-\s]/g, "");
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Error calling OpenLibrary API");

  const data = await response.json();
  const bookData = data[`ISBN:${cleanIsbn}`];
  if (!bookData) return null;

  return {
    title: bookData.title,
    author: bookData.authors?.[0]?.name,
    coverUrl: bookData.cover?.medium || bookData.cover?.large,
    isbn: cleanIsbn,
  };
}

export async function searchBooksByTitle(
  query: string,
): Promise<OpenLibraryBook[]> {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`;

  const response = await fetch(url);
  if (!response.ok) throw new Error("Error during OpenLibrary search");

  const data = await response.json();

  return (data.docs || []).map((doc: any) => ({
    title: doc.title,
    author: doc.author_name?.[0],
    coverUrl: doc.cover_i
      ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
      : undefined,
    isbn: doc.isbn?.[0],
  }));
}
