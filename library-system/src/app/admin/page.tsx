"use client";

import { useEffect, useState } from "react";
import { Book } from "@/types/index";
import styles from "./dashboard.module.css";
import BookCard from "@/app/components/admin/BookCard";
import FilterBar from "@/app/components/FilterBar";
import { getStoredUser } from "@/libs/auth";
import { useRouter } from "next/navigation";

type LocationStock = { total: number; available: number };
type Location = "Chennai" | "Bangalore" | "Delhi" | "Mumbai";
const LOCATIONS: Location[] = ["Chennai", "Bangalore", "Delhi", "Mumbai"];
const CATEGORIES = ["CS", "Fiction", "Mathematics", "AI"];

//main dashboard.
export default function AdminDashboard() {
  //state for all the books in the database.
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
    //the fetch method to get all the books from the database and set it to the state.
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
          setFilterLocation("");
          setFilterCategory("");
        }}
        resultLabel={`${filtered.length} book${filtered.length !== 1 ? "s" : ""}`}
        searchPlaceholder="Search by title or author…"
        categoryLabel="All Categories"
        locationLabel="All Branches"
      />

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
