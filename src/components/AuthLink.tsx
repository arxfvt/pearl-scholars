import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth";

export default async function AuthLink() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user)
    return (
      <div className="flex items-center gap-3">
        <Link href="/login" className="whitespace-nowrap hover:underline">Log in</Link>
        <Link href="/signup" className="btn btn-gold whitespace-nowrap px-4">Register</Link>
      </div>
    );
  const admin = await getAdmin();
  return admin ? (
    <Link href="/admin" className="btn btn-gold">Admin</Link>
  ) : (
    <Link href="/account" className="btn btn-gold">My dashboard</Link>
  );
}
