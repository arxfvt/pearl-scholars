export const metadata = { title: "Privacy Policy" , alternates: { canonical: "/privacy" } };

export default function Page() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 px-4 py-10 [&_h2]:mt-6 [&_h2]:text-xl [&_ul]:list-disc [&_ul]:pl-5">
      <h1 className="text-3xl md:text-4xl">Privacy Policy</h1>
      <p className="rounded border border-line bg-surface p-3 text-sm">Draft for review: have a Ugandan lawyer confirm this text before launch.</p>
      <p>Pearl Scholars (&ldquo;we&rdquo;), Mengo, P.O. Box 24930, Kampala, Uganda, processes personal data in line with the Data Protection and Privacy Act, 2019.</p>
      <h2>What we collect</h2>
      <ul>
        <li>Name, email, phone, level of study, school or institution and district.</li>
        <li>Documents you upload (report cards, certificates, ID).</li>
        <li>Account details if you create an account.</li>
        <li>With your consent, anonymous usage statistics (no names, emails or phone numbers are sent to analytics tools).</li>
      </ul>
      <h2>Why we collect it</h2>
      <p>To register you for scholarships, review applications, contact you about your status, and improve the service.</p>
      <h2>Who sees it</h2>
      <p>Our authorised administrators. Documents are stored privately and opened only through short-lived secure links. We share details with a scholarship provider only where needed to process your application.</p>
      <h2>Your rights</h2>
      <p>You may ask to access, correct or delete your data, or withdraw consent, by contacting us. Deleting some data may end your participation in a scholarship.</p>
      <h2>Retention</h2>
      <p>We keep registration data only as long as needed for the purposes above or as required by law.</p>
      <h2>Contact</h2>
      <p>Use the details on our Contact page for any privacy request.</p>
    </div>
  );
}
