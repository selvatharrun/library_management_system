"use client";

import { useState } from "react";
import styles from "./search.module.css";

type SearchResult = {
  title: string;
  author: string;
  publishedYear: number | null;
  isbn: string | null;
  coverUrl: string | null;
  workKey: string | null;
};

type Location = "Chennai" | "Bangalore" | "Delhi" | "Mumbai";

export default function SearchPage() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedBook, setSelectedBook] = useState<SearchResult | null>(null);
  const [copies, setCopies] = useState(1);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState<Location | "">("");

  /* --------------------------
     SEARCH OPEN LIBRARY
  --------------------------- */

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);

    const res = await fetch(`/api/books?q=${query}&external=true`);
    const data = await res.json();

    if (!res.ok) {
      console.error(data.error);
      setLoading(false);
      return;
    }

    setResults(data);
    setLoading(false);
  };

  /* --------------------------
     UI
  --------------------------- */

  return (
    <div style={{ padding: "2rem" }}>

      <h1>Search Books (OpenLibrary)</h1>

      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search for books..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {loading && <p>Loading...</p>}

      <div style={{ display: "grid", gap: "1rem" }}>
        {results.map((book, index) => (
          <div
            key={index}
            style={{
              border: "1px solid gray",
              padding: "1rem",
              display: "flex",
              gap: "1rem"
            }}
          >
            {book.coverUrl && (
              <img
                src={book.coverUrl}
                alt={book.title}
                width={80}
              />
            )}

            <div>
              <h3>{book.title}</h3>
              <p>{book.author}</p>
              <p>{book.publishedYear ?? "Year unknown"}</p>

              <button onClick={() => setSelectedBook(book)}>
                Add to Library
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --------------------------
          MODAL
      --------------------------- */}

      {selectedBook && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>Add to Library</h2>

            <strong>{selectedBook.title}</strong>

            <label>Copies:</label>
            <input
              type="number"
              min={1}
              value={copies}
              onChange={(e) => setCopies(Number(e.target.value))}
            />

            <label>Category:</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Select Category</option>
              <option value="CS">Computer Science</option>
              <option value="Fiction">Fiction</option>
              <option value="Mathematics">Mathematics</option>
              <option value="AI">Artificial Intelligence</option>
            </select>

            <label>Branch:</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value as Location)}
            >
              <option value="">Select Branch</option>
              <option value="Chennai">Chennai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Delhi">Delhi</option>
              <option value="Mumbai">Mumbai</option>
            </select>

            <button
              className={styles.confirmBtn}
              onClick={async () => {

                if (!location) {
                  alert("Select branch");
                  return;
                }

                const res = await fetch("/api/books", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    isbn: selectedBook.isbn,
                    workKey: selectedBook.workKey,
                    copies,
                    category,
                    location
                  })
                });

                const data = await res.json();

                if (res.ok) {
                  alert("Book added successfully");
                  setSelectedBook(null);
                  setCopies(1);
                  setCategory("");
                  setLocation("");
                } else {
                  alert(data.error);
                }
              }}
            >
              Confirm
            </button>

            <button
              className={styles.cancelBtn}
              onClick={() => setSelectedBook(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}