import Image from "next/image";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden bg-[#0A5458] pt-24 text-white lg:pt-28">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(217,183,111,0.26),transparent_28%),linear-gradient(135deg,#0A5458_0%,#07383b_48%,#111111_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-[#f8f2e5] to-transparent" />
      <div className="mx-auto grid min-h-[660px] max-w-7xl items-center gap-10 px-5 pb-16 sm:px-8 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="order-2 max-w-3xl lg:order-1">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
            Το vintage van που φέρνει φαγητό, cocktails και ατμόσφαιρα στο event σου.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/78">
            Το The VeatERAN Van έρχεται στον χώρο σου με street food, ποτά,
            cocktails και μια ξεχωριστή εμπειρία φιλοξενίας για γάμους,
            βαπτίσεις, parties, γενέθλια και εταιρικές εκδηλώσεις.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#quote"
              className="rounded-full bg-[#d9b76f] px-6 py-3.5 text-center text-sm font-bold text-[#082f31] shadow-xl shadow-black/15 transition hover:bg-[#f1d993]"
            >
              Ζήτησε Προσφορά
            </a>
            <a
              href="#menu"
              className="rounded-full border border-white/25 px-6 py-3.5 text-center text-sm font-bold text-white transition hover:border-[#d9b76f] hover:text-[#f3d58f]"
            >
              Δες το Μενού
            </a>
          </div>
        </div>
        <div className="relative order-1 min-h-[430px] lg:order-2">
          <div className="absolute inset-0 rounded-3xl border border-white/15 bg-[linear-gradient(145deg,rgba(248,242,229,0.96),rgba(217,183,111,0.34)),radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.82),transparent_24%)] p-2.5 shadow-xl shadow-black/20">
            <div className="relative h-full min-h-[398px] overflow-hidden rounded-2xl bg-[#113f3f]">
              <Image
                src="/images/hero-van.jpg"
                alt="The VeatERAN Van σε premium event setup"
                fill
                priority
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#062f32]/85 via-[#062f32]/18 to-transparent" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
