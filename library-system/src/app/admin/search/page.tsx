"use client";

import { useState } from "react" ;
import styles from "./search.module.css";

//this cannot use the common type books coz, the results fetched dont need to have all the qualities as books.
//i mean i could introduce ? and say return smthg | null in books.json but, this was fine at the time.
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

  //silly loading... using usestate
  const [loading, setLoading] = useState(false);

  const [selectedBook, setSelectedBook] = useState<SearchResult | null>(null);
  const [copies, setCopies] = useState(1);
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState<Location | "">("");

  //surfing open library.
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

//code for search and add.
  return (
    <div style={{ padding: "2rem" }}>

      <h1>Search Books (OpenLibrary)</h1>

      {/*input over here. */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search for books..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>


      {/*condtional rendering*/}
      {/*the double ampersand means loading... will render if the variable loading is true.*/}
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
                  height={115}
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