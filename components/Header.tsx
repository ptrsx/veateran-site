"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { homepageNav } from "@/lib/homepage-data";

export function Header() {
  const mobileMenuRef = useRef<HTMLDetailsElement>(null);
  const mobileNav = [...homepageNav, { label: "Ζήτησε Προσφορά", href: "/request-quote" }];

  const closeMobileMenu = () => {
    if (mobileMenuRef.current) {
      mobileMenuRef.current.open = false;
    }
  };

  useEffect(() => {
    const details = mobileMenuRef.current;

    if (!details) {
      return;
    }

    const closeMenu = () => {
      details.open = false;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
      }
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !details.contains(event.target)) {
        closeMenu();
      }
    };

    window.addEventListener("scroll", closeMenu, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("scroll", closeMenu);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#062f32]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <a href="/" className="group flex items-center gap-3" aria-label="The VeatERAN Van">
          <Image
            src="/images/brand/veateran-logo-circle-512.png"
            alt=""
            width={36}
            height={36}
            className="size-9 rounded-full border border-[#d9b76f]/60 bg-[#f7f0df] shadow-[0_0_24px_rgba(217,183,111,0.2)]"
            priority
          />
          <Image
            src="/images/brand/veateran-wordmark-cropped-transparent.svg"
            alt="The VeatERAN Van"
            width={132}
            height={31}
            className="h-7 w-auto"
            priority
          />
        </a>
        <nav className="hidden items-center gap-8 text-sm text-white/78 md:flex">
          {homepageNav.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-[#f3d58f]">
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="/request-quote"
          className="hidden rounded-full border border-[#d9b76f]/50 bg-[#d9b76f] px-5 py-2.5 text-sm font-semibold text-[#082f31] shadow-lg shadow-black/10 transition hover:bg-[#f1d993] md:inline-flex"
        >
          Ζήτησε Προσφορά
        </a>
        <details ref={mobileMenuRef} className="group relative md:hidden">
          <summary className="cursor-pointer list-none rounded-full border border-[#d9b76f]/45 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#d9b76f] hover:text-[#f3d58f] [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <div className="absolute right-0 top-12 w-56 rounded-2xl border border-[#d9b76f]/25 bg-[#062f32] p-2 shadow-2xl shadow-black/25">
            {mobileNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-xl px-4 py-3 text-sm text-white/78 transition hover:bg-white/[0.06] hover:text-[#f3d58f]"
                onClick={closeMobileMenu}
              >
                {item.label}
              </a>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
