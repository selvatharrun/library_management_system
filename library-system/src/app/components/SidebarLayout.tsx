"use client";

import { useRouter } from "next/navigation";

type NavLink = {
  href: string;
  label: string;
};

type SidebarLayoutProps = {
  title: string;
  links: NavLink[];
  children: React.ReactNode;
};

export default function SidebarLayout({ title, links, children }: SidebarLayoutProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("lms_user");
    router.push("/");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-zinc-900 text-white p-6 flex flex-col">
        <h2 className="text-xl font-bold mb-8">{title}</h2>

        <nav className="flex flex-col gap-4 flex-1">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-gray-300">
              {link.label}
            </a>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="mt-auto text-sm text-gray-400 hover:text-white text-left cursor-pointer"
        >
          Sign Out
        </button>
      </aside>

      <main className="flex-1 p-10 bg-gray-50">{children}</main>
    </div>
  );
}
