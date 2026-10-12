import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth";

export default async function AuthLink() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <Link href="/login" className="btn btn-gold">Log in</Link>;
  const admin = await getAdmin();
  return admin ? (
    <Link href="/admin" className="btn btn-gold">Admin</Link>
  ) : (
    <Link href="/account" className="btn btn-gold">My registrations</Link>
  );
}
