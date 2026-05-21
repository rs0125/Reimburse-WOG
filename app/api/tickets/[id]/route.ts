import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TicketStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { deleteObject } from "@/lib/r2";

export const runtime = "nodejs";

type AttachmentInput = {
  name: string;
  kind: "IMAGE" | "DOCUMENT";
  contentType: string;
  sizeBytes: number;
  r2Key: string;
};

type PatchBody = {
  status?: TicketStatus;
  title?: string;
  category?: string;
  amount?: number;
  description?: string;
  addAttachments?: AttachmentInput[];
  removeAttachmentIds?: string[];
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  APPROVED: "Approved by Finance",
  REJECTED: "Rejected by Finance",
  PENDING: "Marked pending",
  REVIEW: "Marked under review",
  CANCELLED: "Cancelled",
};

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const existing = await prisma.ticket.findFirst({
    where: { OR: [{ id }, { shortCode: id }] },
    select: { id: true, status: true, submittedByEmpID: true },
  });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });

  const isOwner = existing.submittedByEmpID === user.empID;
  const editingFields =
    body.title !== undefined ||
    body.category !== undefined ||
    body.amount !== undefined ||
    body.description !== undefined ||
    (body.addAttachments && body.addAttachments.length > 0) ||
    (body.removeAttachmentIds && body.removeAttachmentIds.length > 0);
  const editingStatus = body.status !== undefined;

  if (editingFields && !isOwner) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (editingStatus) {
    const wantCancel = body.status === "CANCELLED";
    if (wantCancel && !isOwner && !user.isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (!wantCancel && !user.isAdmin) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (wantCancel && existing.status !== "PENDING" && existing.status !== "REVIEW") {
      return NextResponse.json(
        { error: `cannot cancel ticket in ${existing.status} state` },
        { status: 409 },
      );
    }
  }

  if (editingFields) {
    if (existing.status !== "PENDING" && existing.status !== "REVIEW") {
      return NextResponse.json(
        { error: `cannot edit ticket in ${existing.status} state` },
        { status: 409 },
      );
    }
    if (body.amount !== undefined && (typeof body.amount !== "number" || !isFinite(body.amount) || body.amount < 0)) {
      return NextResponse.json({ error: "amount must be a non-negative number" }, { status: 400 });
    }
  }
  if (editingStatus && !(body.status! in STATUS_LABEL)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const removedR2Keys: string[] = [];
  if (body.removeAttachmentIds?.length) {
    const toRemove = await prisma.attachment.findMany({
      where: {
        id: { in: body.removeAttachmentIds },
        ticketId: existing.id,
      },
      select: { id: true, r2Key: true },
    });
    removedR2Keys.push(...toRemove.map((a) => a.r2Key));
    await prisma.attachment.deleteMany({
      where: {
        id: { in: toRemove.map((a) => a.id) },
        ticketId: existing.id,
      },
    });
  }

  const ticket = await prisma.ticket.update({
    where: { id: existing.id },
    data: {
      title: body.title,
      category: body.category,
      amount: body.amount,
      description: body.description,
      status: editingStatus ? body.status : undefined,
      attachments: body.addAttachments?.length
        ? { create: body.addAttachments }
        : undefined,
      events: {
        create: [
          ...(editingStatus ? [{ label: STATUS_LABEL[body.status as TicketStatus] }] : []),
          ...(editingFields && !editingStatus ? [{ label: "Ticket edited" }] : []),
        ],
      },
    },
    select: {
      id: true,
      shortCode: true,
      status: true,
      updatedAt: true,
    },
  });

  for (const key of removedR2Keys) {
    deleteObject(key).catch(() => {
      // best-effort cleanup; DB row is already gone
    });
  }

  return NextResponse.json(ticket);
}
