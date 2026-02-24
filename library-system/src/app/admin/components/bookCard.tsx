import { useEffect, useState } from "react";
import {Book} from "@/types/index"
import styles from "@/app/admin/dashboard.module.css";


type LocationStock = { total: number; available: number };
type Location = "Chennai" | "Bangalore" | "Delhi" | "Mumbai";
const LOCATIONS: Location[] = ["Chennai", "Bangalore", "Delhi", "Mumbai"];
const CATEGORIES = ["CS", "Fiction", "Mathematics", "AI"];


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

export default BookCard;