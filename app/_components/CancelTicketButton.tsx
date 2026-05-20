"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CancelTicketButton({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    if (!confirm(`Cancel ticket ${ticketId}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Failed: ${data.error ?? res.statusText}`);
        return;
      }
      router.push("/dashboard/history");
      router.refresh();
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn btn-danger" onClick={handleClick} disabled={busy}>
      {busy ? "Cancelling…" : "Cancel ticket"}
    </button>
  );
}
