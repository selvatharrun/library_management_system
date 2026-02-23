// src/services/bookService.ts

import { BookRepository } from "@/libs/repositories/bookRepository";
import { Book, Location } from "@/types";
import { OpenLibraryService } from "./openLibraryService";

export class BookService {

  /* -------------------------
     BASIC OPERATIONS
  -------------------------- */

  static getAll(): Book[] {
    return BookRepository.findAll();
  }

  static getById(id: string): Book {
    const book = BookRepository.findById(id);
    if (!book) {
      throw new Error("Book not found");
    }
    return book;
  }

  static searchLocal(query: string): Book[] {
    return BookRepository.search(query);
  }

  static deleteBook(id: string): void {
    const book = BookRepository.findById(id);
    if (!book) {
      throw new Error("Book not found");
    }

    BookRepository.delete(id);
  }

  /* -------------------------
     OPEN LIBRARY INTEGRATION
  -------------------------- */

  static async searchExternal(query: string) {
    return OpenLibraryService.searchBooks(query);
  }

static async importBook(data: {
  isbn?: string;
  workKey?: string;
  copies: number;

  category?: string;
  location: Location;
}) {

  if (data.copies <= 0) {
    throw new Error("Copies must be greater than 0");
  }

  let metadata;

  /* ========================
     FETCH METADATA
  ======================== */

  if (data.isbn && data.isbn !== "N/A") {
    metadata = await OpenLibraryService.getBookByISBN(data.isbn);
  } 
  else if (data.workKey) {
    const work = await OpenLibraryService.getWorkDetails(data.workKey);

    metadata = {
      title: work?.title ?? "Unknown",
      author: "Unknown",
      publishedYear: null,
      coverUrl: work?.coverUrl,
      summary: work?.description
    };
  }

  if (!metadata || !metadata.title) {
    throw new Error("Book metadata not found");
  }

  /* ------------------------------------
     DUPLICATE DETECTION (ROBUST)
  ------------------------------------- */

  let existing: Book | undefined;

  // 1️⃣ Prefer ISBN if valid
  if (data.isbn && data.isbn !== "N/A") {
    existing = BookRepository.findByISBN(data.isbn);
  }

  // 2️⃣ Then try workKey
  if (!existing && data.workKey) {
    existing = BookRepository.findByWorkKey(data.workKey);
  }

  // 3️⃣ Final fallback: title match
  if (!existing) {
    existing = BookRepository.findAll().find(
      b => b.title.toLowerCase() === metadata.title.toLowerCase()
    );
  }

  /* ------------------------------------
     IF EXISTS → UPDATE STOCK
  ------------------------------------- */

  if (existing) {
    existing.locations[data.location].total += data.copies;
    existing.locations[data.location].available += data.copies;

    // 🔥 If existing book has no workKey, update it now
    if (!existing.workKey && data.workKey) {
      existing.workKey = data.workKey;
    }

    return BookRepository.update(existing);
  }

  /* ------------------------------------
     CREATE NEW BOOK
  ------------------------------------- */

  const newBook: Book = {
    id: crypto.randomUUID(),
    title: metadata.title,
    author: metadata.author,
    publishedYear: metadata.publishedYear,
    isbn: data.isbn ?? "N/A",
    workKey: data.workKey, // 🔥 store it now
    createdAt: new Date().toISOString(),
    coverUrl: metadata.coverUrl,
    summary: metadata.summary,
    category: data.category,

    locations: {
      Chennai: { total: 0, available: 0 },
      Bangalore: { total: 0, available: 0 },
      Delhi: { total: 0, available: 0 },
      Mumbai: { total: 0, available: 0 },
    }
  };

  newBook.locations[data.location].total = data.copies;
  newBook.locations[data.location].available = data.copies;

  return BookRepository.create(newBook);
}
}