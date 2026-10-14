"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup" | "forgot";
interface Values { fullName?: string; email: string; password?: string }

const notices: Record<string, { ok: boolean; text: string }> = {
  confirmed: { ok: true, text: "Your email is confirmed. Log in below to continue." },
  reset: { ok: true, text: "Your password has been changed. Log in with your new password." },
  auth: { ok: false, text: "That link has expired or was already used. Log in below, or register again if you never confirmed your email." },
  google: { ok: false, text: "Google sign-in could not be completed. Please try again or use your email and password." },
};

/** Turns Supabase errors into plain, actionable messages for students. */
function friendly(message: string, mode: Mode): string {
  const m = message.toLowerCase();
  if (m.includes("email not confirmed")) return "Please confirm your email first. Check your inbox (and spam folder) for the link we sent.";
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many attempts right now. Please wait a few minutes and try again.";
  if (m.includes("already registered") || m.includes("already exists")) return "An account with this email already exists. Log in instead, or reset your password.";
  if (m.includes("password")) return "Choose a stronger password: at least 8 characters, mixing letters and numbers.";
  if (m.includes("provider is not enabled")) return "Google sign-in is not available yet. Please use your email and password.";
  return mode === "login" ? "We could not log you in. Please try again." : "Something went wrong. Please try again.";
}

export default function AuthForm({ mode: initialMode, googleEnabled }: { mode: Mode; googleEnabled: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";
  const notice = notices[params.get("notice") ?? params.get("error") ?? ""];
  const [mode, setMode] = useState<Mode>(initialMode);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(notice ?? null);
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>();
  const supabase = createClient();
  const callback = (to: string) => `${location.origin}/auth/callback?next=${encodeURIComponent(to)}`;

  async function onSubmit(v: Values) {
    setMsg(null);
    const email = v.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("email", { message: "Enter a valid email" });

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: callback("/account/password") });
      return setMsg(error ? { ok: false, text: friendly(error.message, mode) } : { ok: true, text: "If an account exists for this email, we've sent a link to set a new password. Check your inbox and spam folder." });
    }
    if (!v.password || v.password.length < 8) return setError("password", { message: "At least 8 characters" });

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: v.password });
      if (error) return setMsg({ ok: false, text: friendly(error.message, mode) });
      router.push(next);
      router.refresh();
      return;
    }

    if (!v.fullName || v.fullName.trim().length < 2) return setError("fullName", { message: "Enter your full name" });
    const { data, error } = await supabase.auth.signUp({
      email, password: v.password,
      options: { data: { full_name: v.fullName.trim() }, emailRedirectTo: callback(next) },
    });
    if (error) return setMsg({ ok: false, text: friendly(error.message, mode) });
    if (data.session) { router.push(next); router.refresh(); return; } // email confirmation turned off
    // Supabase returns an empty identities list when the email is already registered.
    if (data.user && data.user.identities?.length === 0) return setMsg({ ok: false, text: friendly("already registered", mode) });
    setMsg({ ok: true, text: `Almost done! We sent a confirmation link to ${email}. Open it to activate your account, then log in. Can't find it? Check your spam or promotions folder.` });
  }

  async function google() {
    setMsg(null);
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback(next) } });
    if (error) setMsg({ ok: false, text: friendly(error.message, mode) });
  }

  const title = { login: "Log in", signup: "Create your account", forgot: "Reset your password" }[mode];

  return (
    <form method="post" onSubmit={handleSubmit(onSubmit)} className="card mx-auto max-w-md space-y-4 p-5 sm:p-6" noValidate>
      <div>
        <h1 className="text-2xl">{title}</h1>
        {mode === "signup" && <p className="mt-1 text-sm text-muted">Free for every student. Track your registrations and get matched to new scholarships.</p>}
        {mode === "forgot" && <p className="mt-1 text-sm text-muted">Enter your email and we&rsquo;ll send you a link to choose a new password.</p>}
      </div>

      {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-lg border p-3 text-sm ${msg.ok ? "border-ink bg-ivory" : "border-red text-red"}`}>{msg.text}</p>}

      {googleEnabled && mode !== "forgot" && (
        <>
          <button type="button" onClick={google} className="btn btn-outline w-full">
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8Z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9Z"/></svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />or use your email<span className="h-px flex-1 bg-line" /></div>
        </>
      )}

      {mode === "signup" && (
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium">Full name</label>
          <input id="fullName" autoComplete="name" className="input" aria-invalid={!!errors.fullName} {...register("fullName")} />
          {errors.fullName && <p role="alert" className="mt-1 text-sm text-red">{errors.fullName.message}</p>}
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
        <input id="email" type="email" inputMode="email" autoComplete="email" className="input" aria-invalid={!!errors.email} {...register("email")} />
        {errors.email && <p role="alert" className="mt-1 text-sm text-red">{errors.email.message}</p>}
      </div>
      {mode !== "forgot" && (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            {mode === "login" && <button type="button" onClick={() => { setMode("forgot"); setMsg(null); }} className="text-sm underline">Forgot password?</button>}
          </div>
          <div className="relative">
            <input id="password" type={showPw ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} className="input pr-16" aria-invalid={!!errors.password} {...register("password")} />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 px-2 text-sm underline" aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? "Hide" : "Show"}</button>
          </div>
          {mode === "signup" && <p className="mt-1 text-xs text-muted">At least 8 characters.</p>}
          {errors.password && <p role="alert" className="mt-1 text-sm text-red">{errors.password.message}</p>}
        </div>
      )}

      <button disabled={isSubmitting} className="btn btn-gold w-full">
        {isSubmitting ? "Please wait..." : { login: "Log in", signup: "Register", forgot: "Send reset link" }[mode]}
      </button>

      <p className="text-center text-sm">
        {mode === "login" && <>New to Pearl Scholars? <a href={`/signup?next=${encodeURIComponent(next)}`} className="font-bold underline">Register</a></>}
        {mode === "signup" && <>Already have an account? <a href={`/login?next=${encodeURIComponent(next)}`} className="font-bold underline">Log in</a></>}
        {mode === "forgot" && <button type="button" onClick={() => { setMode("login"); setMsg(null); }} className="font-bold underline">Back to log in</button>}
      </p>
    </form>
  );
}
