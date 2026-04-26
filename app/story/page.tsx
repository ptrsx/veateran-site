import type { Metadata } from "next";
import Image from "next/image";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Η ιστορία μας | The VeatERAN Van",
  description:
    "Η ιστορία πίσω από το The VeatERAN Van: από ένα ψητοπωλείο στην Αθήνα το 1995 μέχρι ένα vintage catering & bar van για εκδηλώσεις σε όλη την Ελλάδα.",
};

const storyParagraphs = [
  "Η ιστορία μας ξεκινά το 1995, όταν ο Λάμπρος άνοιξε το ψητοπωλείο του στην Αθήνα με απλά πράγματα: καλό φαγητό, καθαρή δουλειά και σεβασμό στον άνθρωπο που κάθεται στο τραπέζι.",
  "Για σχεδόν 30 χρόνια, με καθημερινή παρουσία, επιμονή στην ποιότητα και φροντίδα στην εξυπηρέτηση, κατάφερε να κερδίσει την εμπιστοσύνη ανθρώπων που επέστρεφαν ξανά και ξανά, όχι μόνο για τη γεύση, αλλά και για τον τρόπο που ένιωθαν.",
  "Σήμερα, ο γιος του, ο Γιώργος, συνεχίζει πάνω σε αυτά τα ίδια θεμέλια. Πατώντας στα χνάρια του πατέρα του, κρατάει την αγάπη για την εστίαση ζωντανή και προσπαθεί να τη μεταφέρει σε νέες μορφές φιλοξενίας.",
  "Το The VeatERAN Van γεννήθηκε μέσα από αυτή τη διαδρομή. Είναι ένας τρόπος να ταξιδέψει η ίδια φροντίδα έξω από το ψητοπωλείο, σε γάμους, βαπτίσεις, ιδιωτικές και εταιρικές εκδηλώσεις, πάντα με την ίδια λογική: τίμιο φαγητό, ευγενικό service και σεβασμό στους ανθρώπους που μας εμπιστεύονται.",
];

export default function StoryPage() {
  return (
    <main className="min-h-screen bg-[#fffaf0]">
      <Header />
      <section className="relative isolate overflow-hidden bg-[#0A5458] px-5 pb-20 pt-32 text-white sm:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(217,183,111,0.22),transparent_28%),linear-gradient(135deg,#0A5458_0%,#07383b_55%,#111111_100%)]" />
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#f3d58f]">
            Η ιστορία μας
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Από το ψητοπωλείο στο The VeatERAN Van
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-white/78">
            Μια διαδρομή που ξεκίνησε το 1995, με αγάπη για το φαγητό, σεβασμό
            στον πελάτη και καθημερινή φροντίδα στην εξυπηρέτηση.
          </p>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-5 text-base leading-7 text-[#3d3a32]">
            {storyParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-[#d9b76f]/25 bg-[#0A5458]/10 shadow-sm">
            <Image
              src="/images/story/psitopoleio.jpg"
              alt="Φωτογραφία από το ψητοπωλείο της οικογένειας"
              fill
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062f32]/20 to-transparent" />
          </div>
        </div>
      </section>

      <section className="bg-[#0A5458] px-5 py-20 text-white sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#f3d58f]">
            Κλείσε το van
          </p>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
            Θέλεις να φέρουμε αυτή τη φροντίδα στο event σου;
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/76">
            Στείλε μας λίγες πληροφορίες για την εκδήλωσή σου και θα σου
            προτείνουμε την κατάλληλη λύση.
          </p>
          <a
            href="/request-quote"
            className="mt-8 inline-flex rounded-full bg-[#d9b76f] px-7 py-3.5 text-sm font-bold text-[#082f31] transition hover:bg-[#f1d993]"
          >
            Ζήτησε Προσφορά
          </a>
        </div>
      </section>
      <Footer />
    </main>
  );
}
