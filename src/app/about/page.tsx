import Link from "next/link";

export const metadata = { title: "About", description: "Pearl Scholars is a fair, open ground where students of every background can find genuine scholarships in Uganda and East Africa." , alternates: { canonical: "/about" } };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-10">
      <h1 className="text-3xl md:text-4xl">About Pearl Scholars</h1>
      <p>Pearl Scholars is a common ground for students of every religion, tribe and background to reach genuine scholarships, from O-Level to postgraduate study. <em>Fursa</em> is the Swahili word for opportunity, and that is what we exist to open up.</p>

      <h2 className="pt-2 text-xl">What we stand for</h2>
      <ul className="list-disc space-y-2 pl-5">
        <li><strong>Fairness.</strong> Every student sees the same listings and registers the same way. We do not ask about religion or ethnicity, and we do not favour any group.</li>
        <li><strong>Genuine opportunities.</strong> We list scholarships from real providers and link to their official pages. Registering through us is always free. Never pay anyone who promises you a scholarship.</li>
        <li><strong>Access.</strong> The site is built to work on a phone with limited data, so cost and location do not stand in the way.</li>
        <li><strong>Respect for your data.</strong> Your documents are private and used only to handle your registration.</li>
      </ul>

      <p>We are based in Mengo, Kampala. Students, parents, teachers and sponsors are welcome to <Link href="/contact" className="font-bold underline">get in touch</Link>, and providers can contact us to list a scholarship.</p>
      <Link href="/scholarships" className="btn btn-gold">Browse scholarships</Link>
    </div>
  );
}
