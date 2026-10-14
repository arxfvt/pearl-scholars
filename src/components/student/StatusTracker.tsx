import type { RegistrationStatus } from "@/lib/types";

const steps: { key: RegistrationStatus; label: string }[] = [
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under review" },
  { key: "shortlisted", label: "Shortlisted" },
  { key: "successful", label: "Successful" },
];

export const nextStep: Record<RegistrationStatus, string> = {
  submitted: "We have received your registration. Keep your documents ready. We will start reviewing soon.",
  under_review: "Our team is reviewing your registration. You don't need to do anything right now.",
  shortlisted: "Great news! Keep your phone on and check your email: the provider may contact you for an interview or more documents.",
  successful: "Congratulations! Check your email for the next steps from the scholarship provider.",
  not_successful: "Not this time, but don't give up. Look at the scholarships recommended for you below.",
};

/** Progress bar of the registration journey. Phone-friendly: labels sit under each dot. */
export default function StatusTracker({ status }: { status: RegistrationStatus }) {
  if (status === "not_successful")
    return <p className="rounded-lg bg-ivory p-2 text-xs font-bold text-red">Not successful this time</p>;
  const current = steps.findIndex((s) => s.key === status);
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label={`Progress: ${steps[current]?.label}`}>
      {steps.map((s, i) => {
        const done = i <= current;
        return (
          <li key={s.key} className="flex flex-col items-center gap-1 text-center">
            <span className={`h-2 w-full rounded-full ${done ? (i === 3 ? "bg-gold" : "bg-ink") : "bg-line"}`} />
            <span className={`text-[11px] leading-tight ${i === current ? "font-bold text-ink" : "text-muted"}`} aria-current={i === current ? "step" : undefined}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
