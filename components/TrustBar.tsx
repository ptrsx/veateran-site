import { trustItems } from "@/lib/homepage-data";

export function TrustBar() {
  return (
    <section className="border-y border-[#d9b76f]/30 bg-[#f8f2e5]">
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-7 text-center sm:grid-cols-3 sm:px-8">
        {trustItems.map((item) => (
          <p key={item} className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0A5458]">
            {item}
          </p>
        ))}
      </div>
    </section>
  );
}
