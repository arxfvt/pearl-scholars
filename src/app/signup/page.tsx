import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Register" };

export default function Page() {
  return (
    <div className="px-4 py-12">
      <Suspense><AuthForm mode="signup" /></Suspense>
    </div>
  );
}
