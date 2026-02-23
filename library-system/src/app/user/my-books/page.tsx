"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/libs/auth";
import styles from "../user.module.css";

const LOCATIONS = ["Chennai", "Bangalore", "Delhi", "Mumbai"] as const;
type Location = typeof LOCATIONS[number];

type LocationStock = { total: number; available: number };
type Book = {
  id: string;
  title: string;
  author: string;
  coverUrl?: string | null;
  category?: string;
  locations: Record<Location, LocationStock>;
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

type EnrichedIssue = Issue & { book: Book | undefined };

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(issue: Issue) {
  return issue.status === "ISSUED" && new Date(issue.dueDate) < new Date();
}

export default function MyBooksPage() {
  const router = useRouter();
  const [issues, setIssues] = useState<EnrichedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"active" | "returned">("active");
  const [returningId, setReturningId] = useState<string | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role === "ADMIN") { router.replace("/"); return; }
    Promise.all([
      fetch(`/api/issues?userId=${user.id}`).then((r) => r.json()),
      fetch("/api/books").then((r) => r.json()),
    ]).then(([issueData, bookData]: [Issue[], Book[]]) => {
      const enriched: EnrichedIssue[] = issueData.map((issue) => ({
        ...issue,
        book: bookData.find((b) => b.id === issue.bookId),
      }));
      // Sort: newest first
      enriched.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
      setIssues(enriched);
      setLoading(false);
    });
  }, []);

  const handleReturn = async (issueId: string) => {
    setReturningId(issueId);
    const res = await fetch(`/api/issues/${issueId}`, { method: "PATCH" });
    const data = await res.json();
    setReturningId(null);
    if (res.ok) {
      setIssues((prev) =>
        prev.map((i) => (i.id === issueId ? { ...i, status: "RETURNED", returnedAt: data.returnedAt } : i))
      );
    } else {
      alert(data.error ?? "Return failed");
    }
  };

  const filtered = issues.filter((i) =>
    tab === "active" ? i.status === "ISSUED" : i.status === "RETURNED"
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Books</h1>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === "active" ? styles.tabActive : ""}`}
          onClick={() => setTab("active")}
        >
          Active ({issues.filter((i) => i.status === "ISSUED").length})
        </button>
        <button
          className={`${styles.tab} ${tab === "returned" ? styles.tabActive : ""}`}
          onClick={() => setTab("returned")}
        >
          Returned ({issues.filter((i) => i.status === "RETURNED").length})
        </button>
      </div>

      {loading && <p>Loading…</p>}
      {!loading && filtered.length === 0 && (
        <p className={styles.empty}>
          {tab === "active" ? "You have no active borrows." : "No returned books yet."}
        </p>
      )}

      <div className={styles.grid}>
        {filtered.map((issue) => (
          <div key={issue.id} className={styles.issueCard}>
            {issue.book?.coverUrl
              ? <img src={issue.book.coverUrl} alt={issue.book.title} className={styles.cover} />
              : <div className={styles.coverPlaceholder} />}
            <div className={styles.issueInfo}>
              <div className={styles.bookTitle}>{issue.book?.title ?? "Unknown Book"}</div>
              <div className={styles.author}>{issue.book?.author}</div>
              {issue.book?.category && (
                <span className={styles.categoryBadge}>{issue.book.category}</span>
              )}
              <div className={styles.metaRow}>
                <span>Branch: {issue.location}</span>
                <span>Issued: {fmt(issue.issuedAt)}</span>
                {issue.status === "ISSUED" ? (
                  <span className={isOverdue(issue) ? styles.overdue : ""}>
                    Due: {fmt(issue.dueDate)}{isOverdue(issue) ? " — Overdue" : ""}
                  </span>
                ) : (
                  <span>Returned: {issue.returnedAt ? fmt(issue.returnedAt) : "—"}</span>
                )}
              </div>
              <span className={`${styles.statusBadge} ${issue.status === "ISSUED" ? styles.statusIssued : styles.statusReturned}`}>
                {issue.status}
              </span>
              {issue.status === "ISSUED" && (
                <button
                  className={styles.returnBtn}
                  disabled={returningId === issue.id}
                  onClick={() => handleReturn(issue.id)}
                >
                  {returningId === issue.id ? "Returning…" : "Return Book"}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
