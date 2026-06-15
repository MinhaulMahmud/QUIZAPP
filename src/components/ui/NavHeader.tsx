"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/topics", label: "Topics" },
  { href: "/dashboard/progress", label: "Progress" },
  { href: "/dashboard/knowledge", label: "Knowledge" },
  { href: "/settings", label: "Settings" },
];

export default function NavHeader() {
  const pathname = usePathname();

  return (
    <header className="flex items-center justify-between border-b px-6 py-4">
      <h1 className="text-lg font-bold">Daily Quiz App</h1>
      <nav className="flex items-center gap-4 text-sm">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              pathname === link.href
                ? "font-medium"
                : "text-zinc-500 hover:text-foreground"
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
