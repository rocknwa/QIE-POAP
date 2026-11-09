import { CONTACT_EMAIL, CONTACT_LINKEDIN_URL } from "../lib/contact";
import { primaryButton, secondaryButton } from "./infoStyles";

/** Email and LinkedIn buttons for reaching the PEOPLE project administrator. */
export default function ContactActions({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col gap-3 sm:flex-row ${className}`}>
      <a href={`mailto:${CONTACT_EMAIL}`} className={primaryButton}>
        <span className="material-symbols-outlined text-lg">mail</span>
        {CONTACT_EMAIL}
      </a>
      <a href={CONTACT_LINKEDIN_URL} target="_blank" rel="noopener noreferrer" className={secondaryButton}>
        <span className="material-symbols-outlined text-lg">open_in_new</span>
        LinkedIn
      </a>
    </div>
  );
}
