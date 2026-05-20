import Link from "next/link";
import SignOutButton from "../_components/SignOutButton";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="inner">
          <Link href="/admin" className="brand">
            <span className="dot" />
            <span>Reimbursement Portal · Admin</span>
          </Link>
          <nav className="nav">
            <Link href="/admin" className="active">Review</Link>
            <Link href="/dashboard">Employee view</Link>
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
