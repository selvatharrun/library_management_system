"use client";

import SidebarLayout from "@/app/components/SidebarLayout";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarLayout
      title="Library Admin"
      links={[
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/search", label: "Search & Add" },
        { href: "/admin/users", label: "Users" },
      ]}
    >
      {children}
    </SidebarLayout>
  );
}