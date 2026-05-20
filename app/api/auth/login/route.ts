import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionEmail } from "@/lib/auth";

export const runtime = "nodejs";

type Body = { email?: string };

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const email = body.email?.trim();
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const verified = await prisma.verifiedNumber.findUnique({
    where: { email },
    select: { empID: true, is_active: true },
  });
  if (!verified?.empID) {
    return NextResponse.json(
      { error: "no employee on file for this email" },
      { status: 404 },
    );
  }
  if (verified.is_active === false) {
    return NextResponse.json({ error: "account inactive" }, { status: 403 });
  }

  await prisma.employee.upsert({
    where: { empID: verified.empID },
    create: { empID: verified.empID },
    update: {},
  });

  await setSessionEmail(email);
  return NextResponse.json({ ok: true });
}
