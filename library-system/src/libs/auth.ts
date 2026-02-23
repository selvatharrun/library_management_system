export function getStoredUser(): { id: string; name: string; email: string; role: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("lms_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
