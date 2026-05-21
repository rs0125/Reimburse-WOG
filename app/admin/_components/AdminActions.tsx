"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "@/app/_components/ConfirmDialog";

type AttachmentLite = {
  id: string;
  name: string;
  kind: "IMAGE" | "DOCUMENT";
};

type TicketSummary = {
  shortCode: string;
  title: string;
  category: string;
  amount: number;
  description: string;
  submitterName: string;
  submitterEmail: string;
  empID: string;
  createdAt: string;
  attachments: AttachmentLite[];
};

type Props = {
  ticketId: string;
  ticket: TicketSummary;
};

type Action = "APPROVED" | "REJECTED";

function fmtINR(n: number) {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default function AdminActions({ ticketId, ticket }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<Action | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openAttachment(id: string) {
    try {
      const res = await fetch(`/api/attachments/${id}/url`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Could not open: ${data.error ?? res.statusText}`);
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  async function confirm() {
    if (!pending || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: pending }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Failed (${res.status})`);
        setBusy(false);
        return;
      }
      setPending(null);
      setBusy(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setBusy(false);
    }
  }

  const actionLabel = pending === "APPROVED" ? "Approve" : "Reject";
  const actionPast = pending === "APPROVED" ? "approved" : "rejected";

  return (
    <>
      <button
        type="button"
        className="btn btn-approve btn-sm"
        onClick={() => {
          setError(null);
          setPending("APPROVED");
        }}
      >
        Approve
      </button>
      <button
        type="button"
        className="btn btn-reject btn-sm"
        onClick={() => {
          setError(null);
          setPending("REJECTED");
        }}
      >
        Reject
      </button>

      <ConfirmDialog
        open={pending !== null}
        maxWidth={560}
        title={`${actionLabel} ticket ${ticket.shortCode}?`}
        body={
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            <div style={{ color: "var(--slate)", fontSize: "0.85rem" }}>
              Review the details below before confirming. This will mark the ticket
              as <strong>{actionPast}</strong> and notify the employee.
            </div>

            <div className="card" style={{ padding: "0.9rem", margin: 0 }}>
              <div style={{ fontWeight: 600, color: "var(--blue)", marginBottom: "0.25rem" }}>
                {ticket.title}
              </div>
              <div style={{ color: "var(--slate)", fontSize: "0.82rem" }}>
                {ticket.category} · Submitted {ticket.createdAt}
              </div>
            </div>

            <dl
              style={{
                display: "grid",
                gridTemplateColumns: "120px 1fr",
                gap: "0.4rem 0.85rem",
                margin: 0,
                fontSize: "0.88rem",
              }}
            >
              <dt style={{ color: "var(--slate)" }}>Employee</dt>
              <dd style={{ margin: 0 }}>
                {ticket.submitterName} · {ticket.empID}
                <div style={{ color: "var(--slate)", fontSize: "0.78rem" }}>
                  {ticket.submitterEmail}
                </div>
              </dd>
              <dt style={{ color: "var(--slate)" }}>Amount</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{fmtINR(ticket.amount)}</dd>
              <dt style={{ color: "var(--slate)" }}>Category</dt>
              <dd style={{ margin: 0 }}>{ticket.category}</dd>
            </dl>

            <div>
              <div style={{ color: "var(--slate)", fontSize: "0.82rem", marginBottom: "0.3rem" }}>
                Description
              </div>
              <div
                style={{
                  background: "var(--ivory-soft)",
                  padding: "0.7rem 0.85rem",
                  borderRadius: "var(--radius-sm)",
                  whiteSpace: "pre-wrap",
                  fontSize: "0.9rem",
                  maxHeight: "10rem",
                  overflowY: "auto",
                }}
              >
                {ticket.description}
              </div>
            </div>

            <div>
              <div style={{ color: "var(--slate)", fontSize: "0.82rem", marginBottom: "0.3rem" }}>
                Attachments ({ticket.attachments.length})
              </div>
              {ticket.attachments.length === 0 ? (
                <div style={{ color: "var(--slate)", fontSize: "0.85rem", fontStyle: "italic" }}>
                  No attachments
                </div>
              ) : (
                <div className="file-list">
                  {ticket.attachments.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      className="file-item"
                      onClick={() => openAttachment(a.id)}
                      style={{
                        textAlign: "left",
                        background: "transparent",
                        border: "1px solid var(--line)",
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      <div>
                        <div className="name">
                          {a.kind === "IMAGE" ? "🖼" : "📄"} {a.name}
                        </div>
                      </div>
                      <span style={{ color: "var(--blue)", fontSize: "0.82rem", fontWeight: 600 }}>
                        Open
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div style={{ color: "var(--bad)", fontSize: "0.88rem" }}>{error}</div>
            )}
          </div>
        }
        confirmLabel={`Confirm ${actionLabel.toLowerCase()}`}
        cancelLabel="Back"
        primaryVariant={pending === "APPROVED" ? "ok" : "danger"}
        busy={busy}
        onConfirm={confirm}
        onClose={() => !busy && setPending(null)}
      />
    </>
  );
}
