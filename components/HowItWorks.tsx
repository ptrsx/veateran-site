import { steps } from "@/lib/homepage-data";

export function HowItWorks() {
  return (
    <section className="bg-[#f8f2e5] px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#b58d3d]">Πώς δουλεύει</p>
        <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-[#0A5458] md:text-4xl">
          Από την πρώτη ιδέα μέχρι το τελευταίο σερβίρισμα.
        </h2>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((item) => (
            <article key={item.step} className="rounded-lg bg-white/75 p-6 shadow-sm">
              <span className="text-sm font-bold text-[#b58d3d]">{item.step}</span>
              <h3 className="mt-6 text-xl font-semibold text-[#111]">{item.title}</h3>
              <p className="mt-4 leading-7 text-[#4f493d]">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
