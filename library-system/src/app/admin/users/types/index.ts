type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  createdAt: string;
};

type Issue = {
  id: string;
  bookId: string;
  location: string;
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: "ISSUED" | "RETURNED";
};

type Book = {
  id: string;
  title: string;
};

export type{ User, Issue,Book};