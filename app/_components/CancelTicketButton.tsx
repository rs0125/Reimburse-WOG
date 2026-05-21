"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { IconX } from "./Icons";

type Props = {
  ticketId: string;
  redirectTo?: string;
};

export default function CancelTicketButton({ ticketId, redirectTo }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function doCancel() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Failed (${res.status})`);
        setBusy(false);
        return;
      }
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="icon-btn danger"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        disabled={busy}
      >
        <IconX /> {busy ? "Cancelling…" : "Cancel"}
      </button>
      <ConfirmDialog
        open={open}
        title={`Cancel ticket ${ticketId}?`}
        body={
          <div>
            <p style={{ margin: 0 }}>
              This will mark the ticket as cancelled and cannot be undone.
            </p>
            {error && (
              <p style={{ color: "var(--bad)", marginTop: "0.5rem", marginBottom: 0, fontSize: "0.88rem" }}>
                {error}
              </p>
            )}
          </div>
        }
        confirmLabel="Cancel ticket"
        cancelLabel="Keep ticket"
        destructive
        busy={busy}
        onConfirm={doCancel}
        onClose={() => !busy && setOpen(false)}
      />
    </>
  );
}
