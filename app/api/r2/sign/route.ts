import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { buildAttachmentKey, getUploadUrl } from "@/lib/r2";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

type Body = {
  filename?: string;
  contentType?: string;
  ticketId?: string;
};

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { filename, contentType, ticketId } = body;
  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType are required" }, { status: 400 });
  }

  const key = buildAttachmentKey({
    ticketId: ticketId ?? "draft",
    filename,
    uuid: randomUUID(),
  });

  try {
    const result = await getUploadUrl(key, contentType, 300);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
