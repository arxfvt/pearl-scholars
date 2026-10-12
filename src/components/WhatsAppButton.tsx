import { site } from "@/lib/site";

export default function WhatsAppButton() {
  if (!site.whatsapp) return null;
  const href = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Hello Pearl Scholars, I have a question about scholarships.")}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"
       className="btn btn-gold fixed bottom-4 right-4 z-40 shadow-lg">
      WhatsApp us
    </a>
  );
}
