import { BookRepository } from "@/libs/repositories/bookRepository";
import { IssueRepository } from "@/libs/repositories/issueRepository";
import { UserRepository } from "@/libs/repositories/userRepository";
import { Issue } from "@/types";

export class IssueService {
  
  static getAllIssues() {
    return IssueRepository.findAll();
  }

  static getUserIssues(userId: string) {
    return IssueRepository.findByUserId(userId);
  }

  static issueBook(userId: string, bookId: string, location: string): Issue {
    const user = UserRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const book = BookRepository.findById(bookId);
    if (!book) throw new Error("Book not found");

    if (!book.locations[location as keyof typeof book.locations]) {
      throw new Error("Invalid location");
    }

    if (book.locations[location as keyof typeof book.locations].available <= 0) {
      throw new Error("No copies available at this location");
    }

    const existing =
      IssueRepository.findActiveByUserAndBook(userId, bookId);

    if (existing) {
      throw new Error("User already borrowed this book");
    }

    // 🔥 Reduce stock at specific location
    book.locations[location as keyof typeof book.locations].available -= 1;
    BookRepository.update(book);

    const now = new Date();
    const due = new Date();
    due.setDate(now.getDate() + 14);

    const record: Issue = {
      id: crypto.randomUUID(),
      userId,
      bookId,
      location,

      issuedAt: now.toISOString(),
      dueDate: due.toISOString(),

      returnedAt: null,
      status: "ISSUED",
    };

    return IssueRepository.create(record);
  }

  static returnBook(issueId: string): Issue {
    const record = IssueRepository.findById(issueId);
    if (!record) throw new Error("Issue not found");

    if (record.status === "RETURNED") {
      throw new Error("Book already returned");
    }

    const book = BookRepository.findById(record.bookId);
    if (!book) throw new Error("Book not found");

    if (!book.locations[record.location as keyof typeof book.locations]) {
      throw new Error("Invalid location on issue record");
    }

    // 🔥 Increase stock at correct location
    book.locations[record.location as keyof typeof book.locations].available += 1;

    if (
      book.locations[record.location as keyof typeof book.locations].available >
      book.locations[record.location as keyof typeof book.locations].total
    ) {
      throw new Error("Invalid book state");
    }

    BookRepository.update(book);

    record.status = "RETURNED";
    record.returnedAt = new Date().toISOString();

    return IssueRepository.update(record);
  }
}