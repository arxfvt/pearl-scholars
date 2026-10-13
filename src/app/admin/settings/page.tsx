import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import SettingsForm from "@/components/admin/SettingsForm";
import { BlockSkeleton } from "@/components/Skeleton";

export default function Page() {
  return (
    <>
      <h1 className="text-3xl">Settings</h1>
      <p className="mb-6 mt-1 text-muted">Contact details and social links shown across the website.</p>
      <Suspense fallback={<BlockSkeleton h="h-96" />}><Form /></Suspense>
    </>
  );
}

async function Form() {
  const supabase = await createClient();
  const { data } = await supabase.from("site_content").select("key,value").in("key", ["contact", "social"]);
  const contact = (data?.find((r) => r.key === "contact")?.value ?? {}) as Record<string, string>;
  const social = (data?.find((r) => r.key === "social")?.value ?? {}) as Record<string, string>;
  const s = (o: Record<string, string>, k: string) => o[k] ?? "";
  return (
    <SettingsForm initial={{
      phone: s(contact, "phone"), whatsapp: s(contact, "whatsapp"), email: s(contact, "email"), address: s(contact, "address"),
      facebook: s(social, "facebook"), instagram: s(social, "instagram"), tiktok: s(social, "tiktok"), x: s(social, "x"), linkedin: s(social, "linkedin"), youtube: s(social, "youtube"),
    }} />
  );
}
