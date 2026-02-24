"use client";

import { use, useEffect, useState } from "react";
import {Book} from "@/types/index"
import styles from "./dashboard.module.css";
import BookCard from "./components/bookCard";
import { getStoredUser } from "@/libs/auth";
import { useRouter } from "next/router";

type LocationStock = { total: number; available: number };
type Location = "Chennai" | "Bangalore" | "Delhi" | "Mumbai";
const LOCATIONS: Location[] = ["Chennai", "Bangalore", "Delhi", "Mumbai"];
const CATEGORIES = ["CS", "Fiction", "Mathematics", "AI"];

//main dashboard.
export default function AdminDashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState<Location | "">("");
  const [filterCategory, setFilterCategory] = useState("");

  const router = useRouter();

  //to do route protection
  useEffect(() => {
    const user = getStoredUser();
    if( !user || user.role !== "ADMIN"){
      router.replace("/");
      return;
    }
    fetch("/api/books")
    .then((r) => r.json())
    .then((data) => {
      setBooks(data);
      setLoading(false);
    });
  }, []);

  const handleUpdated = (updated: Book) => {
    setBooks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };


  //all the fetched books from the query
  const filtered = books.filter((book) => {
    //query the title of the book.
    const q = search.toLowerCase();

    //this pulls all the books fitting the search.
    const matchSearch =
      !q ||
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q);
    
    const matchLocation =
      !filterLocation || book.locations[filterLocation].total > 0;

    const matchCategory =
      !filterCategory || book.category === filterCategory;
    
    //this basically checks all categories
    return matchSearch && matchLocation && matchCategory;
  });


  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Library Inventory</h1>

      <div className={styles.filterBar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search by title or author…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className={styles.filterSelect}
          value={filterLocation}
          onChange={(e) => setFilterLocation(e.target.value as Location | "")}
        >
          <option value="">All Branches</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {(search || filterLocation || filterCategory) && (
          <button
            className={styles.clearBtn}
            onClick={() => {
              setSearch("");
              setFilterLocation("");
              setFilterCategory("");
            }}
          >
            Clear
          </button>
        )}

        <span className={styles.resultCount}>
          {filtered.length} book{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {loading && <p>Loading…</p>}

      {!loading && filtered.length === 0 && (
        <p className={styles.empty}>No books match your filters.</p>
      )}

      <div className={styles.grid}>
        {filtered.map((book) => (
          <BookCard key={book.id} book={book} onUpdated={handleUpdated} />
        ))}
      </div>
    </div>
  );
}
