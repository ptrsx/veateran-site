import Image from "next/image";
import { events } from "@/lib/homepage-data";

export function GalleryPreview() {
  return (
    <section id="events" className="bg-[#fffaf0] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#b58d3d]">Ιδέες για το δικό σου event</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-[#0A5458] md:text-4xl">
            Χώροι και στιγμές όπου το van μπορεί να γίνει μέρος της εμπειρίας.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#4f493d]">
            Ενδεικτικές προτάσεις για διαφορετικούς χώρους, καλεσμένους και
            ατμόσφαιρες, πάντα με βάση το δικό σου event.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {events.map((event) => (
            <article
              key={event.label}
              className="relative flex min-h-64 overflow-hidden rounded-2xl border border-[#d9b76f]/25 bg-[#0A5458] p-5 text-white shadow-md shadow-[#0A5458]/5"
            >
              <Image
                src={event.image}
                alt={event.alt}
                fill
                sizes="(min-width: 1024px) 20vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/68 via-[#0A5458]/18 to-transparent" />
              <div className="relative z-10 flex flex-1 flex-col justify-between">
                <span className="text-xs uppercase tracking-[0.24em] text-[#f3d58f]">Ιδέα εκδήλωσης</span>
                <h3 className="relative z-10 text-xl font-semibold">{event.label}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
