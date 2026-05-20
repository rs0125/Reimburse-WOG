import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function fmtINR(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function DashboardHome() {
  const user = await requireUser();

  const tickets = await prisma.ticket.findMany({
    where: { submittedByEmpID: user.empID },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      shortCode: true,
      title: true,
      category: true,
      amount: true,
      status: true,
      createdAt: true,
    },
  });

  const pending = tickets.filter((t) => t.status === "PENDING" || t.status === "REVIEW").length;
  const approved = tickets.filter((t) => t.status === "APPROVED").length;
  const rejected = tickets.filter((t) => t.status === "REJECTED").length;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Welcome back, {user.name}</h1>
          <div className="sub">Manage your reimbursement requests in one place.</div>
        </div>
        <Link href="/dashboard/new" className="btn btn-primary">+ Raise a ticket</Link>
      </div>

      <div className="row-split" style={{ marginBottom: "1.5rem" }}>
        <div className="card">
          <h3>Pending</h3>
          <div className="stat">{pending}</div>
          <p style={{ margin: 0 }}>Awaiting review</p>
        </div>
        <div className="card">
          <h3>Approved</h3>
          <div className="stat">{approved}</div>
          <p style={{ margin: 0 }}>Reimbursed or scheduled</p>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
          <h2 style={{ margin: 0 }}>Recent activity</h2>
          <Link href="/dashboard/history">View all →</Link>
        </div>
        <div className="ticket-list">
          {tickets.length === 0 && (
            <div style={{ color: "var(--slate)" }}>No tickets yet. Raise your first one.</div>
          )}
          {tickets.slice(0, 3).map((t) => {
            const status = t.status.toLowerCase();
            return (
              <Link
                key={t.id}
                href={`/dashboard/tickets/${t.shortCode}`}
                className="ticket-row ticket-row-link"
              >
                <div>
                  <div className="title">{t.title}</div>
                  <div className="meta">#{t.shortCode} · {t.category} · {fmtDate(t.createdAt)}</div>
                </div>
                <div className="right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span className="amount">{fmtINR(Number(t.amount))}</span>
                  <span className={`badge badge-${status}`}>{status}</span>
                </div>
              </Link>
            );
          })}
        </div>
        <p className="hint" style={{ marginTop: "0.75rem" }}>
          Summary placeholders — {rejected} rejected ticket{rejected === 1 ? "" : "s"} in total.
        </p>
      </div>
    </>
  );
}
