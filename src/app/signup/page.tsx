import AuthPanel from "@/components/AuthPanel";

export const metadata = { title: "Register", description: "Create a free Pearl Scholars account to register for scholarships and track your progress." , alternates: { canonical: "/signup" } };

export default function Page() {
  return <AuthPanel mode="signup" />;
}
