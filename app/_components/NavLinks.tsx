"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type IconKey = "home" | "plus" | "history" | "shield";

const baseLinks: { href: string; label: string; icon: IconKey }[] = [
  { href: "/dashboard",     label: "Home",         icon: "home" },
  { href: "/dashboard/new", label: "Raise Ticket", icon: "plus" },
];

function NavIcon({ icon }: { icon: IconKey }) {
  const common = {
    width: 15,
    height: 15,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (icon === "home")
    return (
      <svg {...common}>
        <path d="M3 12L12 4l9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    );
  if (icon === "plus")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v8M8 12h8" />
      </svg>
    );
  if (icon === "history")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    );
  // shield
  return (
    <svg {...common}>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
    </svg>
  );
}

export default function NavLinks({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const links = isAdmin ? [...baseLinks, { href: "/admin", label: "Admin", icon: "shield" as IconKey }] : baseLinks;
  return (
    <>
      {links.map((l) => {
        const active = pathname === l.href;
        return (
          <Link key={l.href} href={l.href} className={`nav-link ${active ? "active" : ""}`}>
            <NavIcon icon={l.icon} />
            <span>{l.label}</span>
          </Link>
        );
      })}
    </>
  );
}
