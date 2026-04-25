import Image from "next/image";
import { features } from "@/lib/homepage-data";

export function EquipmentFeatures() {
  return (
    <section className="bg-[#111] px-5 py-20 text-white sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2">
        <div className="min-h-[360px] rounded-3xl border border-[#d9b76f]/25 bg-[linear-gradient(145deg,rgba(10,84,88,0.88),rgba(17,17,17,0.95)),radial-gradient(circle_at_30%_20%,rgba(217,183,111,0.28),transparent_32%)] p-6">
          <div className="relative flex h-full min-h-[312px] items-end overflow-hidden rounded-2xl border border-white/10 p-6">
            <Image
              src="/images/bar-setup.jpg"
              alt="Bar setup του The VeatERAN Van"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-[#0A5458]/20 to-transparent" />
            <p className="relative z-10 max-w-sm text-2xl font-semibold tracking-tight">
              Ένα οργανωμένο setup που στήνεται στον χώρο σου.
            </p>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#f3d58f]">Εξοπλισμός</p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
            Πλήρως εξοπλισμένο για food & bar service.
          </h2>
          <div className="mt-10 grid gap-4">
            {features.map((feature) => (
              <div key={feature} className="flex gap-4 border-b border-white/10 pb-4">
                <span className="mt-2 size-2 rounded-full bg-[#d9b76f]" />
                <p className="text-base text-white/78">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
