import rawBorrowRecords from "@/data/borrowRecords.json";
import { BorrowRecord } from "@/types";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src/data/borrowRecords.json");

let borrowRecords: BorrowRecord[] = rawBorrowRecords as BorrowRecord[];

export class BorrowRepository {

  static findAll(): BorrowRecord[] {
    return borrowRecords;
  }

  static findById(id: string): BorrowRecord | undefined {
    return borrowRecords.find(record => record.id === id);
  }

  static findByBookId(bookId: string): BorrowRecord[] {
    return borrowRecords.filter(record => record.bookId === bookId);
  }

  static findByUserId(userId: string): BorrowRecord[] {
    return borrowRecords.filter(record => record.userId === userId);
  }

  static findActiveByBook(bookId: string): BorrowRecord[] {
    return borrowRecords.filter(
      record => record.bookId === bookId && record.status === "BORROWED"
    );
  }

  static findActiveByUserAndBook(userId: string, bookId: string): BorrowRecord | undefined {
    return borrowRecords.find(
      record =>
        record.userId === userId &&
        record.bookId === bookId &&
        record.status === "BORROWED"
    );
  }

  static create(record: BorrowRecord): BorrowRecord {
    borrowRecords.push(record);
    this.persist();
    return record;
  }

  static update(updated: BorrowRecord): BorrowRecord {
    const index = borrowRecords.findIndex(r => r.id === updated.id);
    if (index === -1) throw new Error("Borrow record not found");

    borrowRecords[index] = updated;
    this.persist();
    return updated;
  }

  private static persist() {
    fs.writeFileSync(filePath, JSON.stringify(borrowRecords, null, 2));
  }
}