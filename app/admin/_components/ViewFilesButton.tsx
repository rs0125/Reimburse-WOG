"use client";

import { useEffect, useRef, useState } from "react";

type AttachmentLite = {
  id: string;
  name: string;
  kind: "IMAGE" | "DOCUMENT";
};

export default function ViewFilesButton({ attachments }: { attachments: AttachmentLite[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function openFile(id: string) {
    if (loading) return;
    setLoading(id);
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
      setLoading(null);
    }
  }

  const count = attachments.length;

  return (
    <div className="files-pop" ref={wrapRef}>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        onClick={() => setOpen((v) => !v)}
        disabled={count === 0}
        title={count === 0 ? "No files attached" : `${count} file${count === 1 ? "" : "s"}`}
      >
        View files {count > 0 && `(${count})`}
      </button>
      {open && (
        <div className="menu" role="menu">
          {count === 0 ? (
            <div className="empty">No attachments</div>
          ) : (
            attachments.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => openFile(a.id)}
                disabled={loading === a.id}
              >
                {a.kind === "IMAGE" ? "🖼" : "📄"} {a.name}
                {loading === a.id ? " · loading…" : ""}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
