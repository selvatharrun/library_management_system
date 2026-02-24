export type Role = "ADMIN" | "USER";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export type Location = "Chennai" | "Bangalore" | "Delhi" | "Mumbai";

export interface LocationStock {
  total: number;
  available: number;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publishedYear?: number | null;
  createdAt: string;
  category?: string;
  coverUrl?: string | null;
  summary?: string | null;
  workKey?: string;

  locations: Record<Location, LocationStock>;
}

export type IssueStatus = "ISSUED" | "RETURNED";

export interface Issue {
  id: string;
  userId: string;
  bookId: string;
  location: string;

  issuedAt: string;
  dueDate: string;

  returnedAt: string | null;
  status: IssueStatus;
}
