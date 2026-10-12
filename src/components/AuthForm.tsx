"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").optional(),
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
type Values = z.infer<typeof schema>;

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/account";
  const [msg, setMsg] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });
  const supabase = createClient();

  async function onSubmit(v: Values) {
    setMsg(null);
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: v.email, password: v.password });
      if (error) return setMsg("Incorrect email or password.");
      router.push(next);
      router.refresh();
    } else {
      const { error } = await supabase.auth.signUp({
        email: v.email,
        password: v.password,
        options: { data: { full_name: v.fullName }, emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
      });
      setMsg(error ? error.message : "Check your email to confirm your account.");
    }
  }

  async function google() {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card mx-auto max-w-md space-y-4 p-6" noValidate>
      <h1 className="text-2xl">{mode === "login" ? "Log in" : "Create your account"}</h1>
      {mode === "signup" && (
        <div>
          <label htmlFor="fullName" className="mb-1 block text-sm font-medium">Full name</label>
          <input id="fullName" autoComplete="name" className="input" {...register("fullName")} />
          {errors.fullName && <p role="alert" className="mt-1 text-sm text-red">{errors.fullName.message}</p>}
        </div>
      )}
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
        <input id="email" type="email" autoComplete="email" className="input" {...register("email")} />
        {errors.email && <p role="alert" className="mt-1 text-sm text-red">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
        <input id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} className="input" {...register("password")} />
        {errors.password && <p role="alert" className="mt-1 text-sm text-red">{errors.password.message}</p>}
      </div>
      {msg && <p role="status" className="text-sm">{msg}</p>}
      <button disabled={isSubmitting} className="btn btn-gold w-full">{mode === "login" ? "Log in" : "Register"}</button>
      <button type="button" onClick={google} className="btn btn-outline w-full">Continue with Google</button>
      <p className="text-center text-sm">
        {mode === "login" ? (
          <>New to Pearl Scholars? <a href={`/signup?next=${encodeURIComponent(next)}`} className="font-bold underline">Register</a></>
        ) : (
          <>Already have an account? <a href={`/login?next=${encodeURIComponent(next)}`} className="font-bold underline">Log in</a></>
        )}
      </p>
    </form>
  );
}
