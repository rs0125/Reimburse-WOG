import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import CancelTicketButton from "@/app/_components/CancelTicketButton";
import AttachmentLink from "@/app/_components/AttachmentLink";

export const dynamic = "force-dynamic";

function fmtDateTime(d: Date): string {
  return d.toISOString().replace("T", " ").slice(0, 16);
}

function fmtBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;

  const ticket = await prisma.ticket.findFirst({
    where: { OR: [{ id }, { shortCode: id }] },
    include: {
      attachments: { orderBy: { createdAt: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
      submittedBy: {
        include: { verifiedNumber: { select: { email: true, name: true } } },
      },
    },
  });
  if (!ticket) notFound();
  if (ticket.submittedByEmpID !== user.empID && !user.isAdmin) notFound();

  const images = ticket.attachments.filter((a) => a.kind === "IMAGE");
  const docs = ticket.attachments.filter((a) => a.kind === "DOCUMENT");
  const canModify = ticket.status === "PENDING" || ticket.status === "REVIEW";
  const status = ticket.status.toLowerCase();
  const submitterLabel =
    ticket.submittedBy.verifiedNumber?.email ?? ticket.submittedByEmpID;

  return (
    <>
      <div style={{ marginBottom: "0.5rem" }}>
        <Link href="/dashboard/history">← Back to history</Link>
      </div>

      <div className="page-head">
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ marginBottom: "0.25rem" }}>{ticket.title}</h1>
          <div className="sub">
            #{ticket.shortCode} · {ticket.category} · Submitted {fmtDateTime(ticket.createdAt)}
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
          <span className={`badge badge-${status}`}>{status}</span>
          {canModify && ticket.submittedByEmpID === user.empID && (
            <>
              <Link href={`/dashboard/tickets/${ticket.shortCode}/edit`} className="btn btn-ghost">Edit</Link>
              <CancelTicketButton ticketId={ticket.shortCode} />
            </>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <div className="card">
            <h2>Details</h2>
            <dl className="detail-list">
              <div><dt>Amount</dt><dd>₹{Number(ticket.amount).toLocaleString("en-IN")}</dd></div>
              <div><dt>Category</dt><dd>{ticket.category}</dd></div>
              <div><dt>Submitted by</dt><dd>{submitterLabel}</dd></div>
              <div><dt>Submitted on</dt><dd>{fmtDateTime(ticket.createdAt)}</dd></div>
              <div><dt>Status</dt><dd><span className={`badge badge-${status}`}>{status}</span></dd></div>
            </dl>
            <h3 style={{ marginTop: "1rem" }}>Description</h3>
            <p style={{ color: "var(--ink)" }}>{ticket.description}</p>
          </div>

          {images.length > 0 && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <h2>Media</h2>
              <div className="media-grid">
                {images.map((a) => (
                  <AttachmentLink
                    key={a.id}
                    id={a.id}
                    name={a.name}
                    sizeLabel={fmtBytes(a.sizeBytes)}
                    kind="IMAGE"
                  />
                ))}
              </div>
            </div>
          )}

          {docs.length > 0 && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <h2>Documents</h2>
              <div className="file-list">
                {docs.map((a) => (
                  <AttachmentLink
                    key={a.id}
                    id={a.id}
                    name={a.name}
                    sizeLabel={fmtBytes(a.sizeBytes)}
                    kind="DOCUMENT"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <aside>
          <div className="card">
            <h2>Timeline</h2>
            <ul className="timeline">
              {ticket.events.map((e) => (
                <li key={e.id}>
                  <span className="time">{fmtDateTime(e.createdAt)}</span>
                  <span className="label">{e.label}</span>
                </li>
              ))}
            </ul>
          </div>
          {!canModify && (
            <div className="card" style={{ marginTop: "1rem" }}>
              <h3>Locked</h3>
              <p style={{ margin: 0 }}>
                This ticket can no longer be edited or cancelled because its current status is <strong>{status}</strong>.
              </p>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
