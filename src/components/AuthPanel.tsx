import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import { isGoogleEnabled } from "@/lib/auth-settings";

async function WithSettings({ mode }: { mode: "login" | "signup" }) {
  return <AuthForm mode={mode} googleEnabled={await isGoogleEnabled()} />;
}

export default function AuthPanel({ mode }: { mode: "login" | "signup" }) {
  return (
    <div className="px-4 py-8 sm:py-12">
      <Suspense fallback={<div className="card mx-auto h-96 max-w-md animate-pulse bg-line/40" />}>
        <WithSettings mode={mode} />
      </Suspense>
    </div>
  );
}
