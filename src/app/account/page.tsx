import { connection } from "next/server";
import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth";
import { getContact } from "@/lib/data/content";
import { displayStatus } from "@/lib/data/scholarships";
import { levelLabels, type RegistrationStatus, type Scholarship, type StudyLevel } from "@/lib/types";
import { formatDate } from "@/lib/format";
import ScholarshipCard from "@/components/ScholarshipCard";
import StatusTracker, { nextStep } from "@/components/student/StatusTracker";
import AlertsToggle from "@/components/student/AlertsToggle";
import { BlockSkeleton } from "@/components/Skeleton";

export const metadata = { title: "My dashboard", robots: { index: false } };

export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <Suspense fallback={<BlockSkeleton h="h-96" />}><Dashboard /></Suspense>
    </div>
  );
}

const cardFields = "id,slug,title,provider,provider_hidden,country,summary,amount_text,levels,fields,cover_image_path,deadline,featured,status";
const daysLeft = (iso: string | null, now: number) => (iso ? Math.ceil((new Date(iso).getTime() - now) / 86400000) : null);

async function Dashboard() {
  await connection();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p>Please <Link href="/login?next=/account" className="font-bold underline">log in</Link>.</p>;
  const now = Date.now();

  const [admin, { data: profile }, { data: regs }, { data: saved }, contact] = await Promise.all([
    getAdmin(),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("registrations").select("id,reference,status,created_at,updated_at,scholarship_id,scholarships(title,slug,deadline)").order("created_at", { ascending: false }),
    supabase.from("saved_scholarships").select(`created_at,scholarships(${cardFields})`).order("created_at", { ascending: false }),
    getContact(),
  ]);

  const registeredIds = new Set((regs ?? []).map((r) => r.scholarship_id));
  const savedList = (saved ?? []).map((s) => s.scholarships as unknown as Scholarship).filter(Boolean);
  const level = (profile?.level ?? null) as StudyLevel | null;

  // Recommended: open scholarships for the student's level that they have not registered for yet.
  let rq = supabase.from("scholarships").select(cardFields).eq("status", "published")
    .or(`deadline.is.null,deadline.gte.${new Date(now).toISOString()}`).order("deadline", { ascending: true, nullsFirst: false }).limit(12);
  if (level) rq = rq.contains("levels", [level]);
  const { data: recRaw } = await rq;
  const recommended = ((recRaw ?? []) as unknown as Scholarship[]).filter((s) => !registeredIds.has(s.id)).slice(0, 4);

  // Profile completeness drives autofill quality.
  const needed: [string, unknown][] = [
    ["Full name", profile?.full_name], ["Phone", profile?.phone], ["Level of study", profile?.level], ["School", profile?.institution],
    ["District", profile?.district], ["Gender", profile?.gender], ["Date of birth", profile?.date_of_birth], ["Current class", profile?.current_class],
  ];
  if (level === "o_level" || level === "a_level") needed.push(["Guardian", profile?.guardian_name], ["Guardian phone", profile?.guardian_phone]);
  const filled = needed.filter(([, v]) => !!v).length;
  const pct = Math.round((filled / needed.length) * 100);
  const missing = needed.filter(([, v]) => !v).map(([k]) => k);

  const upcoming = savedList
    .filter((s) => displayStatus(s, now) !== "closed" && !registeredIds.has(s.id))
    .sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
  const progressing = (regs ?? []).filter((r) => ["shortlisted", "successful"].includes(r.status)).length;
  const firstName = (profile?.full_name ?? user.user_metadata?.full_name ?? "").split(" ")[0];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted">Welcome back{firstName ? "," : ""}</p>
          <h1 className="text-3xl">{firstName || "Your dashboard"}</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {admin && <Link href="/admin" className="btn btn-gold">Admin dashboard</Link>}
          <Link href="/account/profile" className="btn btn-outline">Edit profile</Link>
          <form action="/auth/signout" method="post"><button className="btn btn-outline">Log out</button></form>
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Registrations", regs?.length ?? 0], ["Shortlisted or won", progressing], ["Saved", savedList.length], ["Matches open now", recommended.length]].map(([k, n]) => (
          <div key={k as string} className="card p-3 sm:p-4"><dt className="text-xs text-muted sm:text-sm">{k}</dt><dd className="text-2xl font-extrabold sm:text-3xl">{n}</dd></div>
        ))}
      </dl>

      {pct < 100 && (
        <section className="card border-l-4 border-l-gold p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg">Your profile is {pct}% complete</h2>
            <Link href="/account/profile" className="btn btn-gold shrink-0">Complete it</Link>
          </div>
          <div className="mt-3 h-2 rounded-full bg-line" aria-hidden><div className="h-2 rounded-full bg-ink" style={{ width: `${pct}%` }} /></div>
          <p className="mt-2 text-sm text-muted">A complete profile fills in your registration forms for you and lets us match you to the right scholarships. Missing: {missing.join(", ")}.</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-xl">My registrations</h2>
        {!regs?.length ? (
          <div className="card p-6 text-center">
            <p className="text-muted">You haven&rsquo;t registered for a scholarship yet.</p>
            <Link href="/scholarships" className="btn btn-gold mt-4">Find a scholarship</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {regs.map((r) => {
              const s = r.scholarships as unknown as { title: string; slug: string; deadline: string | null } | null;
              const status = r.status as RegistrationStatus;
              return (
                <li key={r.id} className="card space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold">{s ? <Link href={`/scholarships/${s.slug}`} className="hover:underline">{s.title}</Link> : "Scholarship"}</p>
                      <p className="text-xs text-muted">Ref {r.reference} · Registered {formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <StatusTracker status={status} />
                  <p className="text-sm">{nextStep[status]}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {upcoming.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl">Saved: don&rsquo;t miss these deadlines</h2>
          <ul className="space-y-2">
            {upcoming.map((s) => {
              const d = daysLeft(s.deadline, now);
              return (
                <li key={s.id} className="card flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <Link href={`/scholarships/${s.slug}`} className="block truncate font-bold hover:underline">{s.title}</Link>
                    <p className={`text-xs ${d !== null && d <= 14 ? "font-bold text-red" : "text-muted"}`}>{d === null ? "No fixed deadline" : `${formatDate(s.deadline)} · ${d} day${d === 1 ? "" : "s"} left`}</p>
                  </div>
                  <Link href={`/scholarships/${s.slug}/register`} className="btn btn-gold shrink-0 px-4">Register</Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-xl">{level ? `Recommended for ${levelLabels[level]} students` : "Open scholarships"}</h2>
          <Link href={level ? `/scholarships?level=${level}` : "/scholarships"} className="text-sm font-bold underline">See all</Link>
        </div>
        {recommended.length ? (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5">{recommended.map((s) => <ScholarshipCard key={s.id} s={s} now={now} />)}</div>
        ) : (
          <p className="card p-5 text-sm text-muted">No new matches right now. Turn on email alerts below and we&rsquo;ll tell you when one opens.</p>
        )}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-4 sm:p-5">
          <AlertsToggle initial={!!profile?.alerts_opt_in} levelLabel={level ? levelLabels[level] : null} />
        </section>
        <section className="card p-4 sm:p-5">
          <h2 className="text-lg">Need help?</h2>
          <p className="mt-1 text-sm text-muted">Ask us anything about a scholarship or your registration.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {contact.whatsapp && <a href={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent("Hello Pearl Scholars, I need help with my registration.")}`} target="_blank" rel="noopener noreferrer" className="btn btn-gold">WhatsApp us</a>}
            {contact.phone && <a href={`tel:${contact.phone}`} className="btn btn-outline">Call {contact.phone}</a>}
          </div>
        </section>
      </div>

      <section className="card p-4 sm:p-5">
        <h2 className="text-lg">Get your documents ready</h2>
        <p className="mt-1 text-sm text-muted">Most scholarships ask for these. Having clear scans or photos on your phone makes registering quick.</p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {[
            "Latest report card or transcript", "PLE, UCE or UACE result slip or certificate", "National ID, student ID or birth certificate",
            "A recommendation letter from a teacher or head teacher", "A recent passport photo", "A short personal statement: who you are and your goals",
          ].map((t) => (
            <li key={t} className="flex gap-2"><span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />{t}</li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Registering through Pearl Scholars is always free. Never pay anyone who promises you a scholarship.</p>
      </section>
    </div>
  );
}
