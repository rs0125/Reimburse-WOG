"use client";

import { useState } from "react";

type Props = {
  id: string;
  name: string;
  sizeLabel: string;
  kind: "IMAGE" | "DOCUMENT";
};

export default function AttachmentLink({ id, name, sizeLabel, kind }: Props) {
  const [busy, setBusy] = useState(false);

  async function openFile() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/attachments/${id}/url`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(`Could not load file: ${data.error ?? res.statusText}`);
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      alert(`Failed: ${err instanceof Error ? err.message : "unknown error"}`);
    } finally {
      setBusy(false);
    }
  }

  if (kind === "IMAGE") {
    return (
      <figure
        className="media-tile"
        onClick={openFile}
        style={{ cursor: busy ? "default" : "pointer" }}
      >
        <div
          style={{
            background: "#142c46",
            color: "rgba(255,255,255,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            aspectRatio: "4 / 3",
            fontSize: "0.85rem",
          }}
        >
          {busy ? "Loading…" : "🖼 Click to view"}
        </div>
        <figcaption>
          <span>{name}</span>
          <span className="size">{sizeLabel}</span>
        </figcaption>
      </figure>
    );
  }

  return (
    <div className="file-item" onClick={openFile} style={{ cursor: busy ? "default" : "pointer" }}>
      <div>
        <div className="name">📄 {name}</div>
        <div className="size">{sizeLabel}</div>
      </div>
      <span style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--muted)" }}>
        {busy ? "Loading…" : "Open"}
      </span>
    </div>
  );
}
