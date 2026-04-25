import type { Metadata } from "next";
import Image from "next/image";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Gallery | The VeatERAN Van",
  description:
    "Δες φωτογραφίες του The VeatERAN Van, ενός vintage mobile catering & bar van με βάση την Αθήνα για γάμους, βαπτίσεις, parties και εταιρικά events.",
};

type GalleryImage = {
  src: string;
  alt: string;
  featured?: boolean;
};

const dayImages: GalleryImage[] = [
  {
    src: "/images/gallery/van-gallery-day-01.jpg",
    alt: "Ημερήσια φωτογραφία του The VeatERAN Van σε vintage setup",
    featured: true,
  },
  {
    src: "/images/gallery/van-gallery-day-02.jpg",
    alt: "Το The VeatERAN Van σε ημερήσιο event setup",
  },
  {
    src: "/images/gallery/van-gallery-day-03.jpg",
    alt: "Λεπτομέρεια από το vintage van του The VeatERAN Van",
  },
  {
    src: "/images/gallery/van-gallery-day-04.jpg",
    alt: "Food και bar setup του The VeatERAN Van σε ημερήσιο φως",
  },
];

const nightImages: GalleryImage[] = [
  {
    src: "/images/gallery/van-gallery-night-00.jpg",
    alt: "Το The VeatERAN Van σε βραδινή ατμόσφαιρα",
  },
  {
    src: "/images/gallery/van-gallery-night-01.jpg",
    alt: "Βραδινό setup του The VeatERAN Van με φωτισμό",
  },
  {
    src: "/images/gallery/van-gallery-night-02.jpg",
    alt: "Βραδινή παρουσία του The VeatERAN Van σε event",
  },
];

function GalleryCard({
  image,
  priority = false,
}: {
  image: GalleryImage;
  priority?: boolean;
}) {
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-[#d9b76f]/25 bg-[#0A5458] shadow-md shadow-[#0A5458]/5 ${
        image.featured ? "min-h-[420px] md:col-span-4 md:row-span-2" : "min-h-72 md:col-span-2"
      }`}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        priority={priority}
        sizes={image.featured ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 100vw"}
        className="object-cover transition duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-[#0A5458]/10 to-transparent" />
    </article>
  );
}

export default function GalleryPage() {
  return (
    <main className="min-h-screen bg-[#fffaf0]">
      <Header />
      <section className="relative isolate overflow-hidden bg-[#0A5458] px-5 pb-20 pt-32 text-white sm:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(217,183,111,0.22),transparent_28%),linear-gradient(135deg,#0A5458_0%,#07383b_55%,#111111_100%)]" />
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#f3d58f]">
            Gallery
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Το van από κοντά
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-white/78">
            Μια ματιά στις λεπτομέρειες, την αισθητική και την παρουσία του The
            VeatERAN Van — από ημερήσια setups μέχρι βραδινή ατμόσφαιρα.
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-xs font-semibold uppercase tracking-[0.18em] text-[#f3d58f]">
            Vintage αισθητική · Food & bar setup · Με βάση την Αθήνα
          </p>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#b58d3d]">
              Ημέρα
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#0A5458] md:text-4xl">
              Καθαρές γραμμές, φυσικό φως και vintage λεπτομέρειες.
            </h2>
          </div>
          <div className="grid auto-rows-[minmax(280px,auto)] gap-4 md:grid-cols-6">
            {dayImages.map((image, index) => (
              <GalleryCard key={image.src} image={image} priority={index === 0} />
            ))}
          </div>

          <div className="mb-8 mt-16">
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#b58d3d]">
              Βράδυ
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-[#0A5458] md:text-4xl">
              Ζεστός φωτισμός και ατμόσφαιρα για after-dark events.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {nightImages.map((image) => (
              <GalleryCard key={image.src} image={image} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0A5458] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#f3d58f]">
            Κλείσε το van
          </p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
            Θέλεις το van στο δικό σου event;
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/76">
            Στείλε μας λίγες λεπτομέρειες για την εκδήλωσή σου και θα σου
            προτείνουμε την κατάλληλη λύση για food, bar ή ολοκληρωμένο setup.
          </p>
          <a
            href="/request-quote"
            className="mt-8 inline-flex rounded-full bg-[#d9b76f] px-7 py-3.5 text-sm font-bold text-[#082f31] transition hover:bg-[#f1d993]"
          >
            Ζήτησε Προσφορά
          </a>
        </div>
      </section>
    </main>
  );
}
