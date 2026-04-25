import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { RequestQuoteForm } from "@/components/RequestQuoteForm";

export const metadata: Metadata = {
  title: "Ζήτησε Προσφορά | The VeatERAN Van",
  description:
    "Συμπλήρωσε ενδιαφέρον για το The VeatERAN Van, mobile catering & bar van για γάμους, βαπτίσεις, parties και εταιρικά events με βάση την Αθήνα.",
};

export default function RequestQuotePage() {
  return (
    <main className="min-h-screen bg-[#fffaf0]">
      <Header />
      <section className="relative isolate overflow-hidden bg-[#0A5458] px-5 pb-20 pt-32 text-white sm:px-8">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(217,183,111,0.22),transparent_28%),linear-gradient(135deg,#0A5458_0%,#07383b_55%,#111111_100%)]" />
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#f3d58f]">
            The VeatERAN Van
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
            Ζήτησε προσφορά για το event σου
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-white/78">
            Συμπλήρωσε λίγες βασικές πληροφορίες για την εκδήλωσή σου και θα
            επικοινωνήσουμε μαζί σου με διαθεσιμότητα, προτάσεις και ενδεικτικό
            κόστος.
          </p>
          <p className="mx-auto mt-6 max-w-3xl text-xs font-semibold uppercase tracking-[0.18em] text-[#f3d58f]">
            Βάση στην Αθήνα · Διαθέσιμο για εκδηλώσεις σε όλη την Ελλάδα · 30
            χρόνια εμπειρίας στην εστίαση
          </p>
        </div>
      </section>
      <section className="px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <RequestQuoteForm />
        </div>
      </section>
    </main>
  );
}
