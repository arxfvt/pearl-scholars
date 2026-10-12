import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Returns the signed-in user if they have the admin role, otherwise null. Role is read from the database, never from the client. */
export async function getAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin" ? user : null;
}

export async function requireAdmin() {
  const admin = await getAdmin();
  if (!admin) throw new Error("Not authorised");
  return admin;
}
