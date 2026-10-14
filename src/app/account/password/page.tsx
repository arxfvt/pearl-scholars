"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Page() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return setMsg("Use at least 8 characters.");
    if (pw !== pw2) return setMsg("The two passwords do not match.");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setMsg(/session/i.test(error.message) ? "This reset link has expired. Request a new one from the log in page." : "Could not change the password. Try a different one.");
    await supabase.auth.signOut();
    router.push("/login?notice=reset");
  }

  return (
    <div className="px-4 py-8 sm:py-12">
      <form method="post" onSubmit={save} className="card mx-auto max-w-md space-y-4 p-5 sm:p-6">
        <h1 className="text-2xl">Choose a new password</h1>
        {msg && <p role="alert" className="rounded-lg border border-red p-3 text-sm text-red">{msg}</p>}
        <div>
          <label htmlFor="pw" className="mb-1 block text-sm font-medium">New password</label>
          <input id="pw" type={show ? "text" : "password"} autoComplete="new-password" className="input" value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <div>
          <label htmlFor="pw2" className="mb-1 block text-sm font-medium">Repeat new password</label>
          <input id="pw2" type={show ? "text" : "password"} autoComplete="new-password" className="input" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-ink" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show passwords</label>
        <button disabled={busy} className="btn btn-gold w-full">{busy ? "Saving..." : "Save new password"}</button>
      </form>
    </div>
  );
}
