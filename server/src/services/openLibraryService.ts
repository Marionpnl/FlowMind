interface OpenLibraryBook {
  title: string;
  author?: string;
  coverUrl?: string;
}

export async function fetchBookByISBN(
  isbn: string,
): Promise<OpenLibraryBook | null> {
  const cleanIsbn = isbn.replace(/[-\s]/g, "");
  const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Error fetching book data from Open Library");
  }

  const data = await response.json();
  const bookData = data[`ISBN:${cleanIsbn}`];

  if (!bookData) return null;

  return {
    title: bookData.title,
    author: bookData.authors?.[0]?.name,
    coverUrl: bookData.cover?.medium || bookData.cover?.large,
  };
}
