export type Role = "ADMIN" | "STUDENT";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publishedYear?: number | null;
  totalCopies: number;
  availableCopies: number;
  createdAt: string; // ISO string

  coverUrl?: string | null;
  summary?: string | null;
}

export type BorrowStatus = "BORROWED" | "RETURNED" | "OVERDUE";

export interface BorrowRecord {
  id: string;
  userId: string;
  bookId: string;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string | null;
  status: BorrowStatus;
}
