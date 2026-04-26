import Image from "next/image";

export function BrandStory() {
  return (
    <section id="story" className="bg-[#fffaf0] px-5 py-20 sm:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-[#0A5458] md:text-4xl">
            Ένα van με χαρακτήρα, γεύση και διακριτική φιλοξενία.
          </h2>
          <div className="relative mt-8 aspect-[4/3] overflow-hidden rounded-2xl border border-[#d9b76f]/25 bg-[#0A5458]/10 shadow-sm">
            <Image
              src="/images/hero-van-day.jpg"
              alt="Το The VeatERAN Van σε ημερήσιο setup"
              fill
              sizes="(min-width: 1024px) 36vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062f32]/28 to-transparent" />
          </div>
        </div>
        <div className="space-y-5 text-base leading-7 text-[#3d3a32] lg:max-w-2xl">
          <p>
            Με 30 χρόνια εμπειρίας στην εστίαση, το The VeatERAN Van σχεδιάστηκε
            για να φέρνει στον χώρο σου φαγητό, ποτά και φροντισμένο service με
            φυσικό, ανεπιτήδευτο τρόπο.
          </p>
          <p>
            Με βάση την Αθήνα, το van είναι διαθέσιμο για εκδηλώσεις σε όλη την
            Ελλάδα και στήνεται ως ένα όμορφο σημείο συνάντησης με rustic ύφος,
            soft gold λεπτομέρειες και μεσογειακή απλότητα.
          </p>
          <a
            href="/story"
            className="inline-flex rounded-full bg-[#d9b76f] px-6 py-3 text-sm font-bold text-[#082f31] transition hover:bg-[#f1d993]"
          >
            Διαβάστε την ιστορία μας
          </a>
        </div>
      </div>
    </section>
  );
}
