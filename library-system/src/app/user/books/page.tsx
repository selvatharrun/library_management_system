"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/libs/auth";
import FilterBar from "@/app/components/FilterBar";
import styles from "../user.module.css";

const LOCATIONS = ["Chennai", "Bangalore", "Delhi", "Mumbai"] as const;
type Location = typeof LOCATIONS[number];
const CATEGORIES = ["CS", "Fiction", "Mathematics", "AI"];

type LocationStock = { total: number; available: number };
type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  category?: string;
  workKey?: string;
  locations: Record<Location, LocationStock>;
};

function totalAvailable(book: Book) {
  return LOCATIONS.reduce((s, l) => s + book.locations[l].available, 0);
}

export default function UserBooksPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterLocation, setFilterLocation] = useState<Location | "">("");

  // borrow modal
  const [borrowBook, setBorrowBook] = useState<Book | null>(null);
  const [borrowLocation, setBorrowLocation] = useState<Location | "">("");
  const [borrowing, setBorrowing] = useState(false);
  const [borrowError, setBorrowError] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role === "ADMIN") {
       router.replace("/"); 
       return; 
    }
    setUserId(user.id);
    fetch("/api/books")
      .then((r) => r.json())
      .then((d) => { setBooks(d); setLoading(false); });
  }, []);

  const openBorrow = (book: Book) => {
    setBorrowBook(book);
    setBorrowLocation("");
    setBorrowError(null);
  };

  const handleBorrow = async () => {
    if (!borrowBook || !borrowLocation) return;
    setBorrowing(true);
    setBorrowError(null);
    const res = await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, bookId: borrowBook.id, location: borrowLocation }),
    });
    const data = await res.json();
    setBorrowing(false);
    if (res.ok) {
      // update local stock
      setBooks((prev) =>
        prev.map((b) =>
          b.id !== borrowBook.id ? b : {
            ...b,
            locations: {
              ...b.locations,
              [borrowLocation]: {
                ...b.locations[borrowLocation as Location],
                available: b.locations[borrowLocation as Location].available - 1,
              },
            },
          }
        )
      );
      setBorrowBook(null);
      alert("Book borrowed! Due in 14 days.");
    } else {
      setBorrowError(data.error ?? "Something went wrong");
    }
  };

  const filtered = books.filter((book) => {
    const q = search.toLowerCase();
    const matchSearch = !q || book.title.toLowerCase().includes(q) || book.author.toLowerCase().includes(q);
    const matchCategory = !filterCategory || book.category === filterCategory;
    const matchLocation = !filterLocation || book.locations[filterLocation as Location].available > 0;
    return matchSearch && matchCategory && matchLocation;
  });

  const availableLocations = borrowBook
    ? LOCATIONS.filter((l) => borrowBook.locations[l].available > 0)
    : [];

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Browse Books</h1>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        categoryOptions={CATEGORIES}
        categoryValue={filterCategory}
        onCategoryChange={setFilterCategory}
        locationOptions={LOCATIONS}
        locationValue={filterLocation}
        onLocationChange={(value) => setFilterLocation(value as Location | "")}
        onClear={() => {
          setSearch("");
          setFilterCategory("");
          setFilterLocation("");
        }}
        resultLabel={`${filtered.length} book${filtered.length !== 1 ? "s" : ""}`}
        searchPlaceholder="Search by title or author…"
        categoryLabel="All Categories"
        locationLabel="All Branches"
      />

      {loading && <p>Loading…</p>}
      {!loading && filtered.length === 0 && <p className={styles.empty}>No books found.</p>}

      <div className={styles.grid}>
        {filtered.map((book) => {
          const avail = totalAvailable(book);
          return (
            <div key={book.id} className={styles.card}>
              {book.coverUrl
                ? <img src={book.coverUrl} alt={book.title} className={styles.cover} />
                : <div className={styles.coverPlaceholder} />}
              <div className={styles.info}>
                <div className={styles.bookTitle}>{book.title}</div>
                <div className={styles.author}>{book.author}</div>
                {book.category && <span className={styles.categoryBadge}>{book.category}</span>}
                <div className={styles.availability}>
                  {LOCATIONS.map((l) => (
                    <div key={l} className={`${styles.availRow} ${book.locations[l].available === 0 ? styles.availZero : ""}`}>
                      <span>{l}</span>
                      <span>{book.locations[l].available} available</span>
                    </div>
                  ))}
                </div>
                <button
                  className={styles.borrowBtn}
                  disabled={avail === 0}
                  onClick={() => openBorrow(book)}
                >
                  {avail === 0 ? "Unavailable" : "Borrow"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {borrowBook && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>Borrow Book</h2>
            <strong>{borrowBook.title}</strong>
            <label>Select Branch</label>
            <select
              value={borrowLocation}
              onChange={(e) => setBorrowLocation(e.target.value as Location)}
            >
              <option value="">-- Pick a branch --</option>
              {availableLocations.map((l) => (
                <option key={l} value={l}>{l} ({borrowBook.locations[l].available} available)</option>
              ))}
            </select>
            {borrowError && <div className={styles.errorMsg}>{borrowError}</div>}
            <div className={styles.modalActions}>
              <button
                className={styles.confirmBtn}
                disabled={!borrowLocation || borrowing}
                onClick={handleBorrow}
              >
                {borrowing ? "Borrowing…" : "Confirm"}
              </button>
              <button className={styles.cancelBtn} onClick={() => setBorrowBook(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
