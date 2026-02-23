export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 text-white p-6">
        <h2 className="text-xl font-bold mb-8">Library Admin</h2>

        <nav className="flex flex-col gap-4">
          <a href="/admin" className="hover:text-gray-300">
            Dashboard
          </a>
          <a href="/admin/search" className="hover:text-gray-300">
            Search & Add
          </a>
          <a href="/admin/users" className="hover:text-gray-300">
            Users
          </a>
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 p-10 bg-gray-50">
        {children}
      </main>
    </div>
  );
}