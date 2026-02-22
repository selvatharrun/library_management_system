// src/services/bookService.ts

import { BookRepository } from "@/repositories/bookRepository";
import { Book } from "@/types";
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

  static createBook(
    data: Omit<Book, "id" | "createdAt" | "availableCopies">
  ): Book {

    if (data.totalCopies <= 0) {
      throw new Error("Total copies must be greater than 0");
    }

    const existing = BookRepository.findByISBN(data.isbn);
    if (existing) {
      throw new Error("Book with this ISBN already exists");
    }

    const newBook: Book = {
      ...data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      availableCopies: data.totalCopies,
    };

    return BookRepository.create(newBook);
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

  static async importFromISBN(isbn: string): Promise<Book> {

    const metadata = await OpenLibraryService.getBookByISBN(isbn);

    if (!metadata) {
      throw new Error("Book not found in Open Library");
    }

    const existing = BookRepository.findByISBN(isbn);
    if (existing) {
      throw new Error("Book already exists in system");
    }

    const newBook: Book = {
      id: crypto.randomUUID(),
      title: metadata.title,
      author: metadata.author,
      publishedYear: metadata.publishedYear,
      isbn,
      totalCopies: 1,
      availableCopies: 1,
      createdAt: new Date().toISOString(),
      coverUrl: metadata.coverUrl,
      summary: metadata.summary,
    };

    return BookRepository.create(newBook);
  }
}