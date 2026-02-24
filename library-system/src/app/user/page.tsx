"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredUser } from "@/libs/auth";
import styles from "./user.module.css";

export default function UserHomePage() {
  const router = useRouter();

  const [activeCount, setActiveCount] = useState<number | null>(null);
  const [userName, setUserName] = useState("");

  //okay useEffect basically performs a sideEffect based on the dependency array.
  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role === "ADMIN") { 
      router.replace("/"); return; 
    }
    setUserName(user.name);
    fetch(`/api/issues?userId=${user.id}`)
      .then((r) => r.json())
      .then((data: { status: string }[]) => {
        setActiveCount(data.filter((i) => i.status === "ISSUED").length);
      });
      
  }, []); //and the dependency array is empty coz, we want this piece to run only once. (leaving it blank runs it all the time.)


  return (
    <div className={styles.container}>
      
      <h1 className={styles.title}>Welcome back, {userName}</h1>
      <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "2rem" }}>
        {activeCount === null
          ? "Loading your account…"
          : activeCount === 0
          ? "You have no active borrows."
          : `You have ${activeCount} active borrow${activeCount !== 1 ? "s" : ""}.`}
      </p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <a
          href="/user/books"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            padding: "1.25rem 1.5rem",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            textDecoration: "none",
            color: "#111827",
            minWidth: "180px",
            transition: "box-shadow 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.07)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
        >
          <span style={{ fontSize: "22px" }}>📚</span>
          <span style={{ fontWeight: 600, fontSize: "15px" }}>Browse Books</span>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>
            Search and borrow from the catalog
          </span>
        </a>

        <a
          href="/user/my-books"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.4rem",
            padding: "1.25rem 1.5rem",
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            textDecoration: "none",
            color: "#111827",
            minWidth: "180px",
            transition: "box-shadow 0.2s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.07)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
        >
          <span style={{ fontSize: "22px" }}>🔖</span>
          <span style={{ fontWeight: 600, fontSize: "15px" }}>My Books</span>
          <span style={{ fontSize: "12px", color: "#6b7280" }}>
            View and return your borrowed books
          </span>
        </a>
      </div>
    </div>
  );
}
