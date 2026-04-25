import type { Metadata } from "next";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Μενού | The VeatERAN Van",
  description:
    "Δες το ενδεικτικό finger food μενού του The VeatERAN Van για γάμους, βαπτίσεις, parties και εταιρικά events.",
};

const menuSections = [
  {
    title: "Signature street food",
    items: [
      {
        name: "Mini burger",
        description:
          "Mini brioche ψωμάκι, μπιφτέκι από 100% μοσχαρίσιο κιμά, cheddar, ketchup ή BBQ sauce & mayo.",
      },
      {
        name: "Chicken caesar wrap roll",
        description: "Ρολάκι τορτίγιας με κοτόπουλο, λαχανικά και σπιτική caesar sauce.",
      },
      {
        name: "Hot dog",
        description: "Ketchup, mustard και crispy onion.",
      },
      {
        name: "Πίτα club κοτόπουλο",
      },
      {
        name: "Bao bun κοτόπουλο",
        description: "Με αγγούρι, καρότο και μαγιονέζα.",
      },
    ],
  },
  {
    title: "Greek bites & skewers",
    items: [
      {
        name: "Φωλιά",
        description: "Από πίτα με χοιρινό ή κοτόπουλο, VeatERAN sauce και τυρί.",
      },
      {
        name: "The VeatERAN stick",
        description: "Με σπιτικό κεφτεδάκι, ντοματίνι και τυρί gouda.",
      },
      {
        name: "Καλαμάκι χοιρινό με πιτάκι",
      },
      {
        name: "Καλαμάκι κοτόπουλο μπούτι με πιτάκι",
      },
    ],
  },
  {
    title: "Finger food & sharing",
    items: [
      {
        name: "Τυροκροκέτες",
      },
      {
        name: "Spring rolls",
      },
      {
        name: "Χειροποίητες φλογέρες",
        description: "Ζαμπόν-τυρί ή ανθότυρο.",
      },
      {
        name: "Μακαρονοσαλάτα σε κυπελλάκι",
      },
      {
        name: "Ολόκληρη μπόμπα κοτόπουλο / τόνο",
      },
    ],
  },
];

function MenuSection({ section }: { section: (typeof menuSections)[number] }) {
  return (
    <section className="rounded-3xl border border-[#d9b76f]/25 bg-white/70 p-5 shadow-md shadow-[#0A5458]/5 sm:p-7">
      <div className="flex items-center gap-4">
        <span className="h-px w-12 bg-[#d9b76f]" />
        <h2 className="text-2xl font-semibold tracking-tight text-[#0A5458]">
          {section.title}
        </h2>
      </div>
      <div className="mt-7 grid gap-4">
        {section.items.map((item) => (
          <article
            key={item.name}
            className="rounded-2xl border border-[#d9b76f]/20 bg-[#fffaf0]/80 p-5"
          >
            <h3 className="text-lg font-semibold text-[#171717]">{item.name}</h3>
            {item.description ? (
              <p className="mt-2 text-base leading-7 text-[#4f493d]">{item.description}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function MenuPage() {
  return (
    <main className="min-h-screen bg-[#fffaf0]">
      <Header />
      <section className="relative isolate overflow-hidden bg-[#0A5458] px-5 pb-20 pt-32 text-white sm:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(217,183,111,0.22),transparent_28%),linear-gradient(135deg,#0A5458_0%,#07383b_55%,#111111_100%)]" />
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#f3d58f]">
            Ενδεικτικό μενού
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Γεύσεις που στήνονται γύρω από το event σου
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-white/78">
            Street food, finger food και bar-friendly επιλογές που προσαρμόζονται
            στο ύφος της εκδήλωσης, τον χώρο και τον αριθμό των καλεσμένων.
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-xs font-semibold uppercase tracking-[0.18em] text-[#f3d58f]">
            Το μενού είναι ενδεικτικό και μπορεί να διαμορφωθεί ανάλογα με τις
            ανάγκες του event.
          </p>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-3">
          {menuSections.map((section) => (
            <MenuSection key={section.title} section={section} />
          ))}
        </div>
      </section>

      <section className="bg-[#f8f2e5] px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-[#d9b76f]/25 bg-white/70 p-6 text-center shadow-md shadow-[#0A5458]/5 sm:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#b58d3d]">
            Custom setup
          </p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-[#0A5458] md:text-4xl">
            Το μενού προσαρμόζεται στο event
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#4f493d]">
            Οι επιλογές είναι ενδεικτικές. Ανάλογα με τον τύπο της εκδήλωσης, τον
            αριθμό των καλεσμένων και το ύφος που θέλεις να δημιουργήσεις,
            μπορούμε να προτείνουμε food, bar ή ολοκληρωμένο food & bar setup.
          </p>
        </div>
      </section>

      <section className="bg-[#0A5458] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#f3d58f]">
            Κλείσε το van
          </p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
            Θέλεις πρόταση για το δικό σου event;
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/76">
            Στείλε μας λίγες πληροφορίες και θα σου προτείνουμε το κατάλληλο menu
            και setup.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="/request-quote"
              className="rounded-full bg-[#d9b76f] px-7 py-3.5 text-sm font-bold text-[#082f31] transition hover:bg-[#f1d993]"
            >
              Ζήτησε Προσφορά
            </a>
            <a
              href="/files/veateran-menu.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold text-white transition hover:border-[#d9b76f] hover:text-[#f3d58f]"
            >
              Κατέβασε το PDF
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
