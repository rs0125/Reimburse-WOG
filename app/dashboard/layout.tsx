import Link from "next/link";
import NavLinks from "../_components/NavLinks";
import UserMenu from "../_components/UserMenu";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="inner">
          <Link href="/dashboard" className="brand">
            <span className="brand-mark" aria-hidden="true">RP</span>
            <span className="brand-text">
              <span className="brand-title">Reimbursement</span>
              <span className="brand-sub">Portal</span>
            </span>
          </Link>
          <nav className="nav">
            <NavLinks isAdmin={user.isAdmin} />
          </nav>
          <div className="nav-end">
            <UserMenu
              name={user.name}
              empID={user.empID}
              email={user.email}
              isAdmin={user.isAdmin}
            />
          </div>
        </div>
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">© {new Date().getFullYear()} Reimbursement Portal</footer>
    </div>
  );
}
