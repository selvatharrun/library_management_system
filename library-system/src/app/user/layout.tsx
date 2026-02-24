"use client";

import SidebarLayout from "@/app/components/SidebarLayout";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarLayout
      title="My Library"
      links={[
        { href: "/user", label: "Home" },
        { href: "/user/books", label: "Browse Books" },
        { href: "/user/my-books", label: "My Books" },
      ]}
    >
      {children}
    </SidebarLayout>
  );
}
