import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export default async function HistoryPage() {
  const user = await requireUser();

  const tickets = await prisma.ticket.findMany({
    where: { submittedByEmpID: user.empID },
    orderBy: { createdAt: "desc" },
    include: {
      attachments: { select: { id: true } },
    },
  });

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Ticket history</h1>
          <div className="sub">All your past and ongoing reimbursement requests.</div>
        </div>
        <Link href="/dashboard/new" className="btn btn-primary">+ New ticket</Link>
      </div>

      <div className="ticket-list">
        {tickets.length === 0 && (
          <div style={{ color: "var(--slate)" }}>No tickets yet.</div>
        )}
        {tickets.map((t) => {
          const count = t.attachments.length;
          const status = t.status.toLowerCase();
          return (
            <Link
              key={t.id}
              href={`/dashboard/tickets/${t.shortCode}`}
              className="ticket-row ticket-row-link"
            >
              <div>
                <div className="title">{t.title}</div>
                <div className="meta">
                  #{t.shortCode} · {t.category} · Submitted {fmtDate(t.createdAt)}
                  {count > 0 ? ` · ${count} attachment${count === 1 ? "" : "s"}` : ""}
                </div>
              </div>
              <div className="right" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span className="amount">₹{Number(t.amount).toLocaleString("en-IN")}</span>
                <span className={`badge badge-${status}`}>{status}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
