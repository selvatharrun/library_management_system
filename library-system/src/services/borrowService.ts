import { BookRepository } from "@/repositories/bookRepository";
import { BorrowRepository } from "@/repositories/borrowRepository";
import { UserRepository } from "@/repositories/userRepository";
import { BorrowRecord } from "@/types";

export class BorrowService {

  static borrowBook(userId: string, bookId: string): BorrowRecord {
    const user = UserRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const book = BookRepository.findById(bookId);
    if (!book) throw new Error("Book not found");

    if (book.availableCopies <= 0) {
      throw new Error("No copies available");
    }

    const existing =
      BorrowRepository.findActiveByUserAndBook(userId, bookId);

    if (existing) {
      throw new Error("User already borrowed this book");
    }

    book.availableCopies -= 1;
    BookRepository.update(book);

    const now = new Date();
    const due = new Date();
    due.setDate(now.getDate() + 14);

    const record: BorrowRecord = {
      id: crypto.randomUUID(),
      userId,
      bookId,
      borrowedAt: now.toISOString(),
      dueDate: due.toISOString(),
      status: "BORROWED",
    };
    return BorrowRepository.create(record);
  }

  static returnBook(recordId: string): BorrowRecord {
    const record = BorrowRepository.findById(recordId);
    if (!record) throw new Error("Borrow record not found");

    if (record.status === "RETURNED") {
      throw new Error("Book already returned");
    }

    const book = BookRepository.findById(record.bookId);
    if (!book) throw new Error("Book not found");

    book.availableCopies += 1;

    if (book.availableCopies > book.totalCopies) {
      throw new Error("Invalid book state");
    }
    
    BookRepository.update(book);
    record.status = "RETURNED";
    return BorrowRepository.update(record);
  }
}