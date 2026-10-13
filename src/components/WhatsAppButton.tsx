import { getContact } from "@/lib/data/content";

/** Round floating button. Moves up when a page shows the mobile Register bar (see globals.css). */
export default async function WhatsAppButton() {
  const { whatsapp } = await getContact();
  if (!whatsapp) return null;
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello Pearl Scholars, I have a question about scholarships.")}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Chat with Pearl Scholars on WhatsApp"
       className="wa-float fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-ink shadow-lg transition-[bottom] md:h-auto md:w-auto md:gap-2 md:px-5 md:py-3 md:font-bold">
      <svg viewBox="0 0 24 24" aria-hidden className="h-7 w-7 md:h-5 md:w-5" fill="currentColor">
        <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 11.9 11.9 0 0 0 4.6 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.3Z" />
      </svg>
      <span className="hidden md:inline">WhatsApp us</span>
    </a>
  );
}
