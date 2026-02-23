"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "STUDENT";
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

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [issues, setIssues] = useState<Record<string, Issue[]>>({});
  const [loadingIssues, setLoadingIssues] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/books").then((r) => r.json()),
    ]).then(([u, b]) => {
      setUsers(u);
      setBooks(b);
    });
  }, []);

  const bookTitle = (bookId: string) =>
    books.find((b) => b.id === bookId)?.title ?? "Unknown Book";

  const toggleExpand = async (userId: string) => {
    if (expandedId === userId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(userId);

    if (!issues[userId]) {
      setLoadingIssues(userId);
      const res = await fetch(`/api/issues?userId=${userId}`);
      const data: Issue[] = await res.json();
      data.sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
      setIssues((prev) => ({ ...prev, [userId]: data }));
      setLoadingIssues(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchRole;
  });

  return (
    <div style={{ padding: "2rem", maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: "1.5rem" }}>
        Users
      </h1>

      {/* ---- Filter bar ---- */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.5rem", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1, minWidth: 200, padding: "0.45rem 0.75rem",
            border: "1px solid #d1d5db", borderRadius: 6, fontSize: 14, outline: "none",
          }}
        />
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{
            padding: "0.45rem 0.6rem", border: "1px solid #d1d5db",
            borderRadius: 6, fontSize: 14, background: "#fff",
          }}
        >
          <option value="">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="STUDENT">Student</option>
        </select>
        <span style={{ fontSize: 13, color: "#6b7280", marginLeft: "auto" }}>
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* ---- User list ---- */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.map((user) => {
          const isExpanded = expandedId === user.id;
          const userIssues = issues[user.id] ?? [];
          const activeCount = userIssues.filter((i) => i.status === "ISSUED").length;

          return (
            <div
              key={user.id}
              style={{
                background: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {/* Header row */}
              <div
                onClick={() => toggleExpand(user.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                  padding: "0.85rem 1rem",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{user.name}</div>
                  <div style={{ fontSize: 13, color: "#6b7280" }}>{user.email}</div>
                </div>
                <span
                  style={{
                    padding: "0.12rem 0.55rem",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    background: user.role === "ADMIN" ? "#fef3c7" : "#dbeafe",
                    color: user.role === "ADMIN" ? "#92400e" : "#1d4ed8",
                  }}
                >
                  {user.role}
                </span>
                <span style={{ fontSize: 12, color: "#9ca3af" }}>
                  Joined {fmt(user.createdAt)}
                </span>
                <span style={{ fontSize: 12, color: "#6366f1" }}>
                  {isExpanded ? "▲" : "▼"}
                </span>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid #f3f4f6" }}>
                  {loadingIssues === user.id ? (
                    <p style={{ fontSize: 13, color: "#6b7280", padding: "0.75rem 0" }}>
                      Loading records…
                    </p>
                  ) : userIssues.length === 0 ? (
                    <p style={{ fontSize: 13, color: "#6b7280", padding: "0.75rem 0" }}>
                      No borrow records.
                    </p>
                  ) : (
                    <>
                      <div style={{ fontSize: 13, color: "#374151", padding: "0.75rem 0 0.5rem", fontWeight: 600 }}>
                        {userIssues.length} record{userIssues.length !== 1 ? "s" : ""}
                        {activeCount > 0 && (
                          <span style={{ fontWeight: 400, color: "#6b7280" }}>
                            {" "}· {activeCount} active
                          </span>
                        )}
                      </div>
                      <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ textAlign: "left", color: "#6b7280", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                            <th style={{ padding: "0.4rem 0.5rem", borderBottom: "1px solid #f3f4f6" }}>Book</th>
                            <th style={{ padding: "0.4rem 0.5rem", borderBottom: "1px solid #f3f4f6" }}>Branch</th>
                            <th style={{ padding: "0.4rem 0.5rem", borderBottom: "1px solid #f3f4f6" }}>Issued</th>
                            <th style={{ padding: "0.4rem 0.5rem", borderBottom: "1px solid #f3f4f6" }}>Due</th>
                            <th style={{ padding: "0.4rem 0.5rem", borderBottom: "1px solid #f3f4f6" }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userIssues.map((issue) => {
                            const overdue =
                              issue.status === "ISSUED" && new Date(issue.dueDate) < new Date();
                            return (
                              <tr key={issue.id} style={{ borderBottom: "1px solid #f9fafb" }}>
                                <td style={{ padding: "0.4rem 0.5rem", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                  {bookTitle(issue.bookId)}
                                </td>
                                <td style={{ padding: "0.4rem 0.5rem" }}>{issue.location}</td>
                                <td style={{ padding: "0.4rem 0.5rem" }}>{fmt(issue.issuedAt)}</td>
                                <td style={{ padding: "0.4rem 0.5rem", color: overdue ? "#dc2626" : undefined, fontWeight: overdue ? 600 : undefined }}>
                                  {fmt(issue.dueDate)}{overdue ? " — Overdue" : ""}
                                </td>
                                <td style={{ padding: "0.4rem 0.5rem" }}>
                                  <span
                                    style={{
                                      padding: "0.12rem 0.5rem",
                                      borderRadius: 999,
                                      fontSize: 11,
                                      fontWeight: 600,
                                      background: issue.status === "ISSUED" ? "#dbeafe" : "#d1fae5",
                                      color: issue.status === "ISSUED" ? "#1d4ed8" : "#065f46",
                                    }}
                                  >
                                    {issue.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}