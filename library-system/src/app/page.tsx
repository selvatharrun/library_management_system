"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  //used to redirect after login/signup
  const router = useRouter();
  

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Login failed");
      return;
    }

    //this is where im fixing the key. refer api/auth/login for more on this.
    localStorage.setItem("lms_user", JSON.stringify(data));

    if (data.role === "ADMIN") {
      router.push("/admin");
    } 
    else {
      router.push("/user");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;
    
    setLoading(true);
    setError(null);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim() }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Signup failed");
      return;
    }

    // Auto-login after signup
    localStorage.setItem("lms_user", JSON.stringify(data));
    router.push("/user");
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f9fafb",
    }}>
      <form
        onSubmit={mode === "login" ? handleLogin : handleSignup}
        style={{
          background: "#fff",
          padding: "2.5rem",
          borderRadius: "10px",
          border: "1px solid #e5e7eb",
          width: "360px",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ fontSize: "22px", fontWeight: 700, textAlign: "center", margin: 0 }}>
          Library Management
        </h1>
        <p style={{ fontSize: "13px", color: "#6b7280", textAlign: "center", margin: 0 }}>
          {mode === "login" ? "Sign in with your email" : "Create a new account"}
        </p>

        {mode === "signup" && (
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              padding: "0.55rem 0.75rem",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              outline: "none",
            }}
          />
        )}

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            padding: "0.55rem 0.75rem",
            border: "1px solid #d1d5db",
            borderRadius: "6px",
            fontSize: "14px",
            outline: "none",
          }}
        />

        {error && (
          <div style={{ color: "#dc2626", fontSize: "13px" }}>{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.6rem",
            background: "#6366f1",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1,
          }}
        >
          {/* if loading is true, then the user is done with sign up */}
          {loading
            ? (mode === "login" ? "Signing in…" : "Creating account…")
            : (mode === "login" ? "Sign In" : "Sign Up")}
        </button>

        <div style={{ textAlign: "center", fontSize: "13px", color: "#6b7280" }}>
          {mode === "login" ? (
            <>No account?{" "}
              <button
                type="button"
                onClick={() => { setMode("signup"); setError(null); }}
                style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
              >
                Sign Up
              </button>
            </>
          ) : (
            <>Already have an account?{" "}
              <button
                type="button"
                onClick={() => { setMode("login"); setError(null); }}
                style={{ background: "none", border: "none", color: "#6366f1", cursor: "pointer", fontWeight: 600, fontSize: "13px" }}
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

