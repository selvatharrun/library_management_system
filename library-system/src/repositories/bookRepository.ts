import rawBooks from "@/data/books.json";
import { Book } from "@/types";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src/data/books.json");

let books: Book[] = rawBooks as Book[];

export class BookRepository {

  static findAll(): Book[] {
    return books;
  }

  static findById(id: string): Book | undefined {
    return books.find(book => book.id === id);
  }

  static findByISBN(isbn: string): Book | undefined {
    return books.find(book => book.isbn === isbn);
  }

  static search(query: string): Book[] {
    const lower = query.toLowerCase();

    return books.filter(book =>
      book.title.toLowerCase().includes(lower) ||
      book.author.toLowerCase().includes(lower)
    );
  }

  static create(book: Book): Book {
    books.push(book);
    this.persist();
    return book;
  }

  static update(updated: Book): Book {
    const index = books.findIndex(b => b.id === updated.id);

    if (index === -1) {
      throw new Error("Book not found");
    }

    books[index] = updated;
    this.persist();
    return updated;
  }

  static delete(id: string): void {
    books = books.filter(book => book.id !== id);
    this.persist();
  }

  private static persist() {
    fs.writeFileSync(filePath, JSON.stringify(books, null, 2));
  }
}