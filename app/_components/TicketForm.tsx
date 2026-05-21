"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Travel", "Meals", "Software", "Office Supplies", "Other"];

type ExistingAttachment = { id: string; name: string; sizeLabel: string };

type Props = {
  mode?: "create" | "edit";
  ticketId?: string;
  initial?: {
    title?: string;
    category?: string;
    amount?: string;
    description?: string;
    existingAttachments?: ExistingAttachment[];
  };
};

type SignResponse = { url: string; key: string };

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function kindFor(file: File): "IMAGE" | "DOCUMENT" {
  return file.type.startsWith("image/") ? "IMAGE" : "DOCUMENT";
}

async function uploadOne(
  file: File,
  ticketIdForKey: string,
): Promise<{ name: string; kind: "IMAGE" | "DOCUMENT"; contentType: string; sizeBytes: number; r2Key: string }> {
  const signRes = await fetch("/api/r2/sign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      ticketId: ticketIdForKey,
    }),
  });
  if (!signRes.ok) {
    const data = await signRes.json().catch(() => ({}));
    throw new Error(data.error ?? "could not get upload URL");
  }
  const { url, key } = (await signRes.json()) as SignResponse;

  const putRes = await fetch(url, {
    method: "PUT",
    headers: { "content-type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!putRes.ok) throw new Error(`upload failed (${putRes.status})`);

  return {
    name: file.name,
    kind: kindFor(file),
    contentType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    r2Key: key,
  };
}

export default function TicketForm({ mode = "create", ticketId, initial }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [amount, setAmount] = useState(initial?.amount ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [existing, setExisting] = useState<ExistingAttachment[]>(initial?.existingAttachments ?? []);
  const removedExistingRef = useRef<Set<string>>(new Set());
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = mode === "edit";

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!next.find((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    setFiles(next);
  }

  function removeFile(idx: number) {
    setFiles(files.filter((_, i) => i !== idx));
  }

  function removeExisting(id: string) {
    removedExistingRef.current.add(id);
    setExisting(existing.filter((a) => a.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const amt = Number(amount);
    if (!isFinite(amt) || amt < 0) {
      setError("Amount must be a non-negative number");
      return;
    }

    setSubmitting(true);
    try {
      const ticketKeyHint = isEdit && ticketId ? ticketId : "draft";
      const uploaded = await Promise.all(files.map((f) => uploadOne(f, ticketKeyHint)));

      if (isEdit && ticketId) {
        const removed = Array.from(removedExistingRef.current);
        const res = await fetch(`/api/tickets/${encodeURIComponent(ticketId)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title,
            category,
            amount: amt,
            description,
            addAttachments: uploaded,
            removeAttachmentIds: removed,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Save failed (${res.status})`);
        }
      } else {
        const res = await fetch("/api/tickets", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title,
            category,
            amount: amt,
            description,
            attachments: uploaded,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Submit failed (${res.status})`);
        }
      }

      setSubmitted(true);
      setTimeout(() => {
        if (isEdit && ticketId) {
          router.push(`/dashboard/tickets/${ticketId}`);
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }, 500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {submitted && (
        <div className="alert">
          {isEdit ? "Ticket updated. Redirecting…" : "Ticket submitted. Redirecting to history…"}
        </div>
      )}
      {error && (
        <div className="alert" style={{ color: "#b3261e", marginBottom: "0.75rem" }}>
          {error}
        </div>
      )}

      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          required
          placeholder="e.g. Client dinner — Mumbai trip"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="row-split">
        <div className="field">
          <label htmlFor="category">Category</label>
          <select id="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="amount">Amount (₹)</label>
          <input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          required
          placeholder="Explain the expense, business purpose, and any relevant context…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      {existing.length > 0 && (
        <div className="field">
          <label>Existing attachments</label>
          <div className="file-list">
            {existing.map((a) => (
              <div key={a.id} className="file-item">
                <div>
                  <div className="name">{a.name}</div>
                  <div className="size">{a.sizeLabel}</div>
                </div>
                <button type="button" onClick={() => removeExisting(a.id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <label>{isEdit ? "Add more attachments" : "Attachments"}</label>
        <label
          className={`dropzone ${dragging ? "is-drag" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
        >
          <div className="label-strong">Drop files here or tap to browse</div>
          <div className="label-sub">Receipts, invoices, screenshots · PDF, PNG, JPG · multiple files supported</div>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,application/pdf"
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
        </label>

        {files.length > 0 && (
          <div className="file-list">
            {files.map((f, i) => (
              <div key={`${f.name}-${i}`} className="file-item">
                <div>
                  <div className="name">{f.name}</div>
                  <div className="size">{formatBytes(f.size)}</div>
                </div>
                <button type="button" onClick={() => removeFile(i)}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : isEdit ? "Save changes" : "Submit ticket"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => router.push(isEdit && ticketId ? `/dashboard/tickets/${ticketId}` : "/dashboard")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
