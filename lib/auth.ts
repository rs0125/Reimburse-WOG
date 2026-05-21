import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "rp_session";
const MAX_AGE = 60 * 60 * 24 * 30;

export type CurrentUser = {
  empID: string;
  email: string;
  name: string;
  isAdmin: boolean;
};

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function setSessionEmail(email: string): Promise<void> {
  const c = await cookies();
  c.set(COOKIE_NAME, email, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE_NAME);
}

export async function getSessionEmail(): Promise<string | null> {
  const c = await cookies();
  return c.get(COOKIE_NAME)?.value ?? null;
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const email = await getSessionEmail();
  if (!email) return null;

  const verified = await prisma.verifiedNumber.findUnique({
    where: { email },
    select: { empID: true, email: true, name: true, is_active: true },
  });
  if (!verified?.empID || verified.is_active === false) return null;

  const lower = (verified.email ?? email).toLowerCase();
  return {
    empID: verified.empID,
    email: verified.email ?? email,
    name: verified.name,
    isAdmin: adminEmails().has(lower),
  };
});

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/");
  return u;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/");
  if (!u.isAdmin) redirect("/dashboard");
  return u;
}
