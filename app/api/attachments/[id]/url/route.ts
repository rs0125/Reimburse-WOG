import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDownloadUrl } from "@/lib/r2";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    select: {
      r2Key: true,
      name: true,
      contentType: true,
      ticket: { select: { submittedByEmpID: true } },
    },
  });
  if (!attachment) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (attachment.ticket.submittedByEmpID !== user.empID && !user.isAdmin) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const url = await getDownloadUrl(attachment.r2Key, 300, { contentType: attachment.contentType });
    return NextResponse.json({ url, name: attachment.name, contentType: attachment.contentType });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
