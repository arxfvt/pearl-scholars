import AuthPanel from "@/components/AuthPanel";

export const metadata = { title: "Log in", robots: { index: false } };

export default function Page() {
  return <AuthPanel mode="login" />;
}
