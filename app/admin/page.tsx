import { prisma } from "@/lib/prisma";
import AdminActions from "./_components/AdminActions";
import ViewFilesButton from "./_components/ViewFilesButton";

export const dynamic = "force-dynamic";

function formatINR(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default async function AdminPage() {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      submittedBy: {
        include: { verifiedNumber: { select: { email: true, name: true } } },
      },
      attachments: { select: { id: true, name: true, kind: true } },
    },
  });

  type Row = {
    empID: string;
    name: string;
    email: string;
    pendingCount: number;
    pendingAmount: number;
    approvedCount: number;
    approvedAmount: number;
  };

  const byUser = new Map<string, Row>();
  for (const t of tickets) {
    const u = t.submittedBy;
    const vn = u.verifiedNumber;
    const email = vn?.email ?? "";
    const key = u.empID;
    if (!byUser.has(key)) {
      byUser.set(key, {
        empID: u.empID,
        name: vn?.name ?? email.split("@")[0] ?? u.empID,
        email,
        pendingCount: 0,
        pendingAmount: 0,
        approvedCount: 0,
        approvedAmount: 0,
      });
    }
    const row = byUser.get(key)!;
    const amount = Number(t.amount);
    if (t.status === "PENDING" || t.status === "REVIEW") {
      row.pendingCount += 1;
      row.pendingAmount += amount;
    } else if (t.status === "APPROVED") {
      row.approvedCount += 1;
      row.approvedAmount += amount;
    }
  }

  const employeeRows = Array.from(byUser.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Admin · Reimbursement review</h1>
          <div className="sub">
            Review pending submissions and act on them. Approvals are final.
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ margin: 0 }}>Employees</h2>
          <div className="sub" style={{ fontSize: "0.85rem", color: "var(--slate)" }}>
            Pending and approved counts and amounts, by employee.
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th className="num">Pending</th>
                <th className="num">Pending amount</th>
                <th className="num">Approved</th>
                <th className="num">Approved amount</th>
              </tr>
            </thead>
            <tbody>
              {employeeRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--slate)" }}>
                    No employees yet.
                  </td>
                </tr>
              )}
              {employeeRows.map((r) => (
                <tr key={r.empID}>
                  <td style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: "0.8rem" }}>
                    {r.empID}
                  </td>
                  <td>{r.name}</td>
                  <td style={{ color: "var(--slate)" }}>{r.email}</td>
                  <td className="num">{r.pendingCount}</td>
                  <td className="num">{formatINR(r.pendingAmount)}</td>
                  <td className="num">{r.approvedCount}</td>
                  <td className="num">{formatINR(r.approvedAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--line)" }}>
          <h2 style={{ margin: 0 }}>Entries</h2>
          <div className="sub" style={{ fontSize: "0.85rem", color: "var(--slate)" }}>
            All submitted tickets. Approve or reject pending entries.
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Employee</th>
                <th className="title-cell">Title / Details</th>
                <th className="num">Amount</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Files</th>
                <th style={{ textAlign: "right" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--slate)" }}>
                    No tickets submitted.
                  </td>
                </tr>
              )}
              {tickets.map((t) => {
                const status = t.status.toLowerCase();
                const isPending = t.status === "PENDING" || t.status === "REVIEW";
                return (
                  <tr key={t.id}>
                    <td style={{ fontFamily: "var(--font-mono, ui-monospace)", fontSize: "0.82rem" }}>
                      {t.shortCode}
                    </td>
                    <td>
                      <div>
                        {t.submittedBy.verifiedNumber?.name ??
                          t.submittedBy.verifiedNumber?.email?.split("@")[0] ??
                          t.submittedBy.empID}
                      </div>
                      <div style={{ color: "var(--slate)", fontSize: "0.78rem" }}>
                        {t.submittedBy.empID}
                      </div>
                    </td>
                    <td className="title-cell" style={{ maxWidth: 340 }}>
                      <div className="title">{t.title}</div>
                      <div className="desc">
                        {t.category} · {t.description}
                      </div>
                    </td>
                    <td className="num">{formatINR(Number(t.amount))}</td>
                    <td>
                      <span className={`badge badge-${status}`}>{status}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <ViewFilesButton
                        attachments={t.attachments.map((a) => ({
                          id: a.id,
                          name: a.name,
                          kind: a.kind,
                        }))}
                      />
                    </td>
                    <td>
                      <div className="actions">
                        <AdminActions ticketId={t.id} disabled={!isPending} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
