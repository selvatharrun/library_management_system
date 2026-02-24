// src/services/bookService.ts

import { BookRepository } from "@/libs/repositories/bookRepository";
import { Book, Location } from "@/types";
import { OpenLibraryService } from "./openLibraryService";

export class BookService {
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

  //update inventory in diff locations.
  static updateLocations(id: string, locations: Book["locations"]): Book {
    const book = BookRepository.findById(id);
    if (!book) {
      throw new Error("Book not found");
    }

    // Validate: available can't exceed total for any location
    for (const loc of Object.keys(locations) as Array<keyof typeof locations>) {
      const { total, available } = locations[loc];
      if (available > total) {
        throw new Error(`Available cannot exceed total for ${loc}`);
      }
      if (total < 0 || available < 0) {
        throw new Error(`Quantities cannot be negative for ${loc}`);
      }
    }

    book.locations = locations;
    return BookRepository.update(book);
  }

  //search external is for admin side, search and add operation.
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

      //book can be fetched using isbn or workKey. 
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


      //detect duplicate
      let existing: Book | undefined;

      //Prefer ISBN if valid
      if (data.isbn && data.isbn !== "N/A") {
        existing = BookRepository.findByISBN(data.isbn);
      }

      //Then try workKey
      if (!existing && data.workKey) {
        existing = BookRepository.findByWorkKey(data.workKey);
      }

      //Final fallback: title match
      if (!existing) {
        existing = BookRepository.findAll().find(
          b => b.title.toLowerCase() === metadata.title.toLowerCase()
        );
      }

      //update stock if book exists.
      if (existing) {
        existing.locations[data.location].total += data.copies;
        existing.locations[data.location].available += data.copies;

        // If existing book has no workKey, update it now
        if (!existing.workKey && data.workKey) {
          existing.workKey = data.workKey;
        }

        return BookRepository.update(existing);
      }

      //create a new book, if it doesnt exist
      const newBook: Book = {
        id: crypto.randomUUID(),
        title: metadata.title,
        author: metadata.author,
        publishedYear: metadata.publishedYear,
        isbn: data.isbn ?? "N/A",
        workKey: data.workKey, 
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