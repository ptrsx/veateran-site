import { services } from "@/lib/homepage-data";

export function ServicesGrid() {
  return (
    <section id="services" className="bg-[#0A5458] px-5 py-20 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#f3d58f]">Υπηρεσίες</p>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
              Για κάθε event που αξίζει ιδιαίτερο service.
            </h2>
          </div>
          <p className="max-w-md text-white/72">
            Προσαρμόζουμε το van, το menu και την ομάδα στο ύφος της ημέρας.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article key={service.title} className="rounded-lg border border-white/12 bg-white/[0.05] p-6 transition hover:border-[#d9b76f]/60 hover:bg-white/[0.08]">
              <span className="mb-8 block h-px w-14 bg-[#d9b76f]" />
              <h3 className="text-xl font-semibold">{service.title}</h3>
              <p className="mt-3 text-sm leading-6 text-white/70">{service.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
