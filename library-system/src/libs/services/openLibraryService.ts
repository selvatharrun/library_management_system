// src/services/openLibraryService.ts

export class OpenLibraryService {

  private static BASE_URL = "https://openlibrary.org";

private static headers = {
  "User-Agent": "LMS/1.0 (selvatharrun005@gmail.com)",
  "Accept": "application/json"
};

  //this one is for the admin side of things. searchbooks is only used on the search and add part.
  static async searchBooks(query: string) {
    const url = `${this.BASE_URL}/search.json?q=${encodeURIComponent(query)}`;
    console.log(url);
    const res = await fetch(url, { headers: this.headers });

    if (!res.ok) {
      throw new Error("OpenLibrary search failed");
    }

    const contentType = res.headers.get("content-type");

    if (!contentType || !contentType.includes("application/json")) {
      console.error("OpenLibrary returned non-JSON:", await res.text());
      return [];
    }
    const data = await res.json();
    //we only need the top 10 of them.
    return data.docs.slice(0, 10).map((doc: any) => ({
      title: doc.title ?? "Unknown",
      author: doc.author_name?.[0] ?? "Unknown",
      publishedYear: doc.first_publish_year ?? null,
      isbn: doc.isbn?.[0] ?? null,
      //workKey or isbn is okay to pull things from openlibrary.
      workKey: doc.key ?? null,
      coverUrl: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
        : null
    }));
  }


  //returns a book by ISBN
  static async getBookByISBN(isbn: string) {
    const url =
      `${this.BASE_URL}/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const res = await fetch(url, { headers: this.headers });

    if (!res.ok) {
      throw new Error("OpenLibrary ISBN lookup failed");
    }

    const data = await res.json();
    const bookData = data[`ISBN:${isbn}`];

    if (!bookData) return null;
    //null coercion with workkey coz, we want this to work if ISBN fails
    const workKey = bookData.works?.[0]?.key ?? null;
    const summary = workKey
      ? await this.getWorkDescription(workKey)
      : undefined;

    return {
      title: bookData.title ?? "Unknown",
      author: bookData.authors?.[0]?.name ?? "Unknown",
      publishedYear: this.extractYear(bookData.publish_date),
      coverUrl: bookData.cover?.large ?? bookData.cover?.medium ?? null,
      summary
    };
  }

  //im using this in bookService, this is what is used to add books in books.json basically.
  static async getWorkDetails(workKey: string) {
    const url = `${this.BASE_URL}${workKey}.json`;
    const res = await fetch(url, { headers: this.headers });

    if (!res.ok){ 
        return null;
    }
    const data = await res.json();

    return {
      title: data.title ?? "Unknown",
      description: this.normalizeDescription(data.description),
      subjects: data.subjects ?? [],
      coverUrl: data.covers?.[0]
        ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
        : null
    };
  }


  //just the description.
  static async getWorkDescription(workKey: string) {
    const details = await this.getWorkDetails(workKey);
    return details?.description;
  }


  //handle descrip, coz we aint sure what desc is going to be
  private static normalizeDescription(desc: string | undefined | {value : string}): string | undefined {

    if (!desc) return undefined;
    if (typeof desc === "string") return desc;
    if (typeof desc === "object" && desc.value) {
      return desc.value;
    }
    return undefined;
  }

  private static extractYear(publishDate: string | undefined): number | null {
    if (!publishDate) return null;

    const match = publishDate.match(/\d{4}/);//regex literal we want only the 4 digits lol
    return match ? parseInt(match[0]) : null;

  }
}