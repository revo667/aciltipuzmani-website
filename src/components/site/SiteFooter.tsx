import { useQuery } from "@tanstack/react-query";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone, Send, Youtube } from "lucide-react";
import { defaultSettings, settingsQuery, type SocialKind } from "@/lib/content";

/** X ve WhatsApp lucide'de yok; sade SVG ile ciziliyor. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.9 2H22l-7.1 8.1L23 22h-6.8l-5.3-6.9L4.8 22H1.7l7.6-8.7L1 2h7l4.8 6.3L18.9 2Zm-1.1 18h1.7L7.3 3.8H5.5L17.8 20Z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.1.1-1.8-.1a13 13 0 0 1-5.6-4.6c-.4-.6-.9-1.5-.9-2.4 0-.9.5-1.4.7-1.6.2-.2.4-.3.6-.3h.5c.2 0 .4 0 .6.4l.8 1.9c.1.2 0 .4-.1.5l-.4.5c-.1.1-.2.3-.1.5.3.6 1 1.5 1.7 2 .5.4 1 .6 1.3.7.2.1.4 0 .5-.1l.6-.7c.2-.2.3-.2.5-.1l1.8.9c.2.1.4.2.4.3.1.1.1.5-.1 1.1Z" />
    </svg>
  );
}

type IconComponent = React.ComponentType<{ className?: string }>;

const socialIcons: Record<SocialKind, IconComponent> = {
  facebook: Facebook,
  x: XIcon,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  whatsapp: WhatsAppIcon,
  telegram: Send,
};

const socialNames: Record<SocialKind, string> = {
  facebook: "Facebook",
  x: "X",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
};

export function SiteFooter() {
  const { data: settings } = useQuery(settingsQuery());
  const s = settings ?? defaultSettings;

  const hasContact = Boolean(s.contactEmail || s.contactPhone || s.contactAddress);
  const columns = s.footerColumns.filter((column) => column.links.length > 0);

  return (
    <footer className="mt-24 surface-hero text-primary-foreground">
      <div className="container-page grid gap-10 py-14 md:grid-cols-3">
        <div>
          <h3 className="font-display text-lg font-semibold">{s.siteName}</h3>
          <p className="mt-2 max-w-sm text-sm opacity-80">{s.footerAbout}</p>

          {s.socialLinks.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {s.socialLinks.map((link) => {
                const Icon = socialIcons[link.kind];
                return (
                  <a
                    key={`${link.kind}-${link.url}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={socialNames[link.kind]}
                    title={socialNames[link.kind]}
                    className="inline-flex size-9 items-center justify-center rounded-lg border border-primary-foreground/25 opacity-85 transition-opacity hover:opacity-100"
                  >
                    <Icon className="size-4" />
                  </a>
                );
              })}
            </div>
          ) : null}
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h4 className="text-sm font-semibold uppercase tracking-wide opacity-70">
              {column.title}
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={`${link.href}-${link.label}`}>
                  <a href={link.href} className="opacity-85 hover:opacity-100">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {hasContact ? (
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide opacity-70">İletişim</h4>
            <ul className="mt-3 space-y-2 text-sm opacity-85">
              {s.contactEmail ? (
                <li className="flex items-start gap-2">
                  <Mail className="mt-0.5 size-4 shrink-0" />
                  <a href={`mailto:${s.contactEmail}`} className="hover:opacity-100">
                    {s.contactEmail}
                  </a>
                </li>
              ) : null}
              {s.contactPhone ? (
                <li className="flex items-start gap-2">
                  <Phone className="mt-0.5 size-4 shrink-0" />
                  <a
                    href={`tel:${s.contactPhone.replace(/\s/g, "")}`}
                    className="hover:opacity-100"
                  >
                    {s.contactPhone}
                  </a>
                </li>
              ) : null}
              {s.contactAddress ? (
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0" />
                  <span className="whitespace-pre-line">{s.contactAddress}</span>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
      <div className="border-t border-primary-foreground/15 py-5 text-center text-xs opacity-70">
        {s.copyright.replace("{yil}", String(new Date().getFullYear()))}
      </div>
    </footer>
  );
}
