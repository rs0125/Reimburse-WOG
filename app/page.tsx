import { redirect } from "next/navigation";
import LoginForm from "./_components/LoginForm";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ERROR_MESSAGES: Record<string, string> = {
  oauth_not_configured: "Google sign-in isn't configured yet.",
  missing_code: "Google sign-in was cancelled.",
  invalid_state: "Sign-in session expired. Please try again.",
  token_exchange_failed: "Could not complete Google sign-in.",
  no_access_token: "Could not complete Google sign-in.",
  userinfo_failed: "Could not read your Google profile.",
  email_not_verified: "Your Google email is not verified.",
  not_on_file: "No employee record on file for that email.",
  inactive: "Your account is inactive. Contact admin.",
  access_denied: "You declined the Google sign-in prompt.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(user.isAdmin ? "/admin" : "/dashboard");

  const sp = await searchParams;
  const rawErr = typeof sp.error === "string" ? sp.error : null;
  const email = typeof sp.email === "string" ? sp.email : null;
  const err = rawErr
    ? `${ERROR_MESSAGES[rawErr] ?? "Sign-in failed."}${email ? ` (${email})` : ""}`
    : null;

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <div className="brand">
          <span className="dot" />
          <span>Reimbursement Portal</span>
        </div>
        <p className="auth-sub">Sign in with your work email to raise and track reimbursement tickets.</p>

        {err && (
          <div className="alert" style={{ marginBottom: "0.75rem", color: "#b3261e" }}>
            {err}
          </div>
        )}

        <a href="/api/auth/google" className="btn btn-primary btn-block" style={{ textDecoration: "none", textAlign: "center", marginBottom: "0.75rem" }}>
          Continue with Google
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: "0.75rem 0", color: "var(--slate)", fontSize: "0.8rem" }}>
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
          <span>or</span>
          <span style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>

        <LoginForm />
      </div>
    </main>
  );
}
