"use client";

import { useState } from "react";

type SearchResult = {
  title: string;
  author: string;
  publishedYear: number | null;
  isbn: string | null;
  coverUrl: string | null;
  workKey: string | null;
};

export default function SearchPage() {

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);

    const res = await fetch(`/api/books/search?q=${query}`);
    const data = await res.json();

    setResults(data);
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem" }}>

      <h1>Search Books</h1>

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

              <button>
                Add to Library
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}