"use client";

import { useEffect, useState } from "react";
import styles from "./dashboard.module.css";

type LocationStock = { total: number; available: number };
type Location = "Chennai" | "Bangalore" | "Delhi" | "Mumbai";
const LOCATIONS: Location[] = ["Chennai", "Bangalore", "Delhi", "Mumbai"];
const CATEGORIES = ["CS", "Fiction", "Mathematics", "AI"];

type Book = {
  id: string;
  title: string;
  author: string;
  isbn: string;
  publishedYear?: number | null;
  coverUrl?: string | null;
  category?: string;
  workKey?: string;
  locations: Record<Location, LocationStock>;
};

/* -----------------------------------------------
   BOOK CARD
----------------------------------------------- */
function BookCard({ book, onUpdated }: { book: Book; onUpdated: (b: Book) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<Location, LocationStock>>(
    () => JSON.parse(JSON.stringify(book.locations))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTotal = (locs: Record<Location, LocationStock>) =>
    LOCATIONS.reduce((sum, l) => sum + locs[l].total, 0);

  const getTotalAvailable = (locs: Record<Location, LocationStock>) =>
    LOCATIONS.reduce((sum, l) => sum + locs[l].available, 0);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/books/${book.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locations: draft }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      onUpdated(data);
      setEditing(false);
    } else {
      setError(data.error ?? "Save failed");
    }
  };

  const handleCancel = () => {
    setDraft(JSON.parse(JSON.stringify(book.locations)));
    setEditing(false);
    setError(null);
  };

  return (
    <div className={styles.card}>
      {book.coverUrl ? (
        <img src={book.coverUrl} alt={book.title} className={styles.cover} />
      ) : (
        <div className={styles.coverPlaceholder} />
      )}

      <div className={styles.info}>
        {book.workKey ? (
          <a
            href={`https://openlibrary.org${book.workKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.bookTitle}
          >
            {book.title}
          </a>
        ) : (
          <div className={styles.bookTitle}>{book.title}</div>
        )}

        <div className={styles.author}>{book.author}</div>

        {book.category && (
          <span className={styles.categoryBadge}>{book.category}</span>
        )}

        <div className={styles.stockSummary}>
          <span>{getTotal(book.locations)} total</span>
          <span className={styles.dot}>·</span>
          <span>{getTotalAvailable(book.locations)} available</span>

          <button
            className={styles.expandBtn}
            onClick={() => setExpanded((p) => !p)}
          >
            {expanded ? "▲ Hide" : "▼ By location"}
          </button>
        </div>

        {expanded && (
          <div className={styles.locationTable}>
            <div className={styles.locationHeader}>
              <span>Branch</span>
              <span>Total</span>
              <span>Available</span>
            </div>

            {LOCATIONS.map((loc) =>
              editing ? (
                <div key={loc} className={styles.locationRow}>
                  <span>{loc}</span>
                  <input
                    type="number"
                    min={0}
                    className={styles.qtyInput}
                    value={draft[loc].total}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value));
                      setDraft((prev) => ({
                        ...prev,
                        [loc]: {
                          ...prev[loc],
                          total: val,
                          available: Math.min(prev[loc].available, val),
                        },
                      }));
                    }}
                  />
                  <input
                    type="number"
                    min={0}
                    max={draft[loc].total}
                    className={styles.qtyInput}
                    value={draft[loc].available}
                    onChange={(e) => {
                      const val = Math.min(
                        Math.max(0, Number(e.target.value)),
                        draft[loc].total
                      );
                      setDraft((prev) => ({
                        ...prev,
                        [loc]: { ...prev[loc], available: val },
                      }));
                    }}
                  />
                </div>
              ) : (
                <div key={loc} className={styles.locationRow}>
                  <span>{loc}</span>
                  <span>{book.locations[loc].total}</span>
                  <span>{book.locations[loc].available}</span>
                </div>
              )
            )}

            {error && <div className={styles.errorMsg}>{error}</div>}

            <div className={styles.editActions}>
              {editing ? (
                <>
                  <button
                    className={styles.saveBtn}
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button className={styles.cancelEditBtn} onClick={handleCancel}>
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  className={styles.editBtn}
                  onClick={() => setEditing(true)}
                >
                  Edit Quantities
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* -----------------------------------------------
   DASHBOARD PAGE
----------------------------------------------- */
export default function AdminDashboard() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [filterLocation, setFilterLocation] = useState<Location | "">("");
  const [filterCategory, setFilterCategory] = useState("");

  useEffect(() => {
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

  const filtered = books.filter((book) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      book.title.toLowerCase().includes(q) ||
      book.author.toLowerCase().includes(q);

    const matchLocation =
      !filterLocation || book.locations[filterLocation].total > 0;

    const matchCategory =
      !filterCategory || book.category === filterCategory;

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
