"use client";

import { useRouter } from "next/navigation";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("lms_user");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-white p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-8">My Library</h2>

        <nav className="flex flex-col gap-4 flex-1">
          <a href="/user" className="hover:text-gray-300">
            Home
          </a>
          <a href="/user/books" className="hover:text-gray-300">
            Browse Books
          </a>
          <a href="/user/my-books" className="hover:text-gray-300">
            My Books
          </a>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto text-sm text-gray-400 hover:text-white text-left cursor-pointer"
        >
          Sign Out
        </button>
      </aside>

      {/* Content */}
      <main className="flex-1 p-10 bg-gray-50">
        {children}
      </main>
    </div>
  );
}
