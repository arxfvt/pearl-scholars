import { getContact } from "@/lib/data/content";

export default async function WhatsAppButton() {
  const { whatsapp } = await getContact();
  if (!whatsapp) return null;
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello Pearl Scholars, I have a question about scholarships.")}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
       className="btn btn-gold fixed bottom-4 right-4 z-40 shadow-lg">
      WhatsApp us
    </a>
  );
}
