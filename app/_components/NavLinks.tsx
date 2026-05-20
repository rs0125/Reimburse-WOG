"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const baseLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/dashboard/new", label: "Raise Ticket" },
  { href: "/dashboard/history", label: "History" },
];

export default function NavLinks({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...baseLinks, { href: "/admin", label: "Admin" }] : baseLinks;
  return (
    <>
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link key={l.href} href={l.href} className={active ? "active" : ""}>
            {l.label}
          </Link>
        );
      })}
    </>
  );
}
