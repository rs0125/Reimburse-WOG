"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore — clear navigation anyway
    }
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className={className}
      style={{
        marginLeft: "0.5rem",
        background: "transparent",
        border: "none",
        color: "inherit",
        cursor: busy ? "default" : "pointer",
        font: "inherit",
        padding: 0,
      }}
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
