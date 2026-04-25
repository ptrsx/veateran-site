import Image from "next/image";
import { menuItems } from "@/lib/homepage-data";

export function MenuPreview() {
  return (
    <section id="menu" className="bg-[#f8f2e5] px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#b58d3d]">Ενδεικτικό μενού</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-[#0A5458] md:text-4xl">
            Ενδεικτικές γεύσεις για χαλαρό, φροντισμένο service.
          </h2>
          <a href="/request-quote" className="mt-8 inline-flex rounded-full bg-[#0A5458] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#07383b]">
            Ζήτησε custom πρόταση
          </a>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {menuItems.map((item) => (
            <article key={item.label} className="group relative min-h-40 overflow-hidden rounded-2xl border border-[#d9b76f]/25 bg-white/70 shadow-md shadow-[#0A5458]/5 sm:min-h-48">
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes="(min-width: 1024px) 15vw, (min-width: 640px) 25vw, 50vw"
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/12 to-transparent" />
              <h3 className="absolute inset-x-4 bottom-4 z-10 text-sm font-semibold text-white">
                {item.label}
              </h3>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
