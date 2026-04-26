export function Footer() {
  const links = [
    {
      label: "Instagram",
      href: "https://www.instagram.com/theveateran/",
      icon: (
        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
          <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
        </svg>
      ),
      external: true,
    },
    {
      label: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61554101022587&ref=NONE_xav_ig_profile_page_web",
      icon: (
        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.5 21v-8h2.7l.4-3h-3.1V8.1c0-.9.3-1.5 1.6-1.5h1.7V3.9c-.8-.1-1.6-.2-2.5-.2-2.6 0-4.4 1.6-4.4 4.4V10H7v3h2.9v8h3.6Z" />
        </svg>
      ),
      external: true,
    },
    {
      label: "sales@veateran.gr",
      href: "mailto:sales@veateran.gr",
      icon: (
        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
          <path d="m4 7 8 6 8-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "+30 6947 005 008",
      href: "tel:+306947005008",
      icon: (
        <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="none">
          <path
            d="M7.4 4.5 9.7 4c.7-.2 1.4.2 1.7.8l1 2.3c.2.6.1 1.2-.4 1.6l-1.3 1.1a10.8 10.8 0 0 0 3.5 3.5l1.1-1.3c.4-.5 1.1-.7 1.6-.4l2.3 1c.7.3 1 1 .8 1.7l-.5 2.3c-.2.8-.9 1.4-1.8 1.4A13.7 13.7 0 0 1 4 6.3c0-.9.6-1.6 1.4-1.8Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <footer className="bg-[#111] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em]">The VeatERAN Van</p>
          <p className="mt-3 text-sm text-white/55">Βάση στην Αθήνα. Εκδηλώσεις σε όλη την Ελλάδα.</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-white/68">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 hover:text-[#f3d58f]"
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
            >
              {link.icon}
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
