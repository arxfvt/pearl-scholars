import { redirectTo } from "@/lib/redirect";
import { createClient } from "@/lib/supabase/server";

/**
 * Lands here after: email confirmation, password-reset links and Google sign-in.
 * Supabase has already confirmed the email before redirecting, so if the code exchange fails
 * (typically: link opened in a different browser, e.g. the Gmail app) we tell the student to log in instead of showing an error.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/account";
  const isReset = safe.startsWith("/account/password");

  const err = searchParams.get("error_description") ?? searchParams.get("error");
  if (err) {
    const expired = /expired|invalid|otp/i.test(err);
    return redirectTo(`/login?error=${expired || isReset ? "auth" : "google"}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirectTo(`${safe}`);
    return redirectTo(`/login?${isReset ? "error=auth" : `notice=confirmed&next=${encodeURIComponent(safe)}`}`);
  }
  return redirectTo(`/login?error=auth`);
}
