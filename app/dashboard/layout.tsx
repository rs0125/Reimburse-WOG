import Link from "next/link";
import NavLinks from "../_components/NavLinks";
import SignOutButton from "../_components/SignOutButton";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="inner">
          <Link href="/dashboard" className="brand">
            <span className="dot" />
            <span>Reimbursement Portal</span>
          </Link>
          <nav className="nav">
            <NavLinks isAdmin={user.isAdmin} />
            <span style={{ marginLeft: "0.5rem", color: "var(--slate)", fontSize: "0.85rem" }}>
              {user.name} · {user.empID}
            </span>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">© {new Date().getFullYear()} Reimbursement Portal</footer>
    </div>
  );
}
