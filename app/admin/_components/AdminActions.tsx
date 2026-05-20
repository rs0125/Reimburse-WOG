"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminActions({
  ticketId,
  disabled,
}: {
  ticketId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"APPROVED" | "REJECTED" | null>(null);

  async function act(status: "APPROVED" | "REJECTED") {
    if (disabled || busy) return;
    if (status === "REJECTED" && !confirm("Reject this ticket?")) return;
    setBusy(status);
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Failed: ${data.error ?? res.statusText}`);
        return;
      }
      router.refresh();
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-approve btn-sm"
        onClick={() => act("APPROVED")}
        disabled={disabled || busy !== null}
      >
        {busy === "APPROVED" ? "Approving…" : "Approve"}
      </button>
      <button
        type="button"
        className="btn btn-reject btn-sm"
        onClick={() => act("REJECTED")}
        disabled={disabled || busy !== null}
      >
        {busy === "REJECTED" ? "Rejecting…" : "Reject"}
      </button>
    </>
  );
}
