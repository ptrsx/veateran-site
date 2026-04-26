"use client";

import { FormEvent, useState } from "react";

const eventTypes = [
  "Γάμος",
  "Βάπτιση",
  "Γενέθλια",
  "Ιδιωτικό party",
  "Εταιρικό event",
  "Ενοικίαση van",
  "Άλλο",
];

const interests = [
  "Food",
  "Bar",
  "Food & Bar",
  "Ενοικίαση van",
  "Δεν είμαι σίγουρος ακόμα",
];

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#d9b76f]/25 bg-white/80 px-4 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#7a7468] focus:border-[#0A5458] focus:ring-4 focus:ring-[#0A5458]/10";

const labelClass = "text-sm font-semibold text-[#0A5458]";

export function RequestQuoteForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("submitting");

    let response: Response;

    try {
      response = await fetch("/api/request-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
    } catch {
      setStatus("error");
      return;
    }

    if (response.ok) {
      form.reset();
      setStatus("success");
      return;
    }

    setStatus("error");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.42fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[#d9b76f]/25 bg-white/75 p-5 shadow-xl shadow-[#0A5458]/5 sm:p-8"
      >
        <div className="grid gap-5 md:grid-cols-2">
          <label className={labelClass}>
            Ονοματεπώνυμο
            <input className={inputClass} name="name" type="text" required />
          </label>
          <label className={labelClass}>
            Τηλέφωνο
            <input className={inputClass} name="phone" type="tel" required />
          </label>
          <label className={labelClass}>
            Email
            <input className={inputClass} name="email" type="email" required />
          </label>
          <label className={labelClass}>
            Ημερομηνία εκδήλωσης
            <input className={inputClass} name="eventDate" type="date" />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Τοποθεσία εκδήλωσης
            <input className={inputClass} name="eventLocation" type="text" />
          </label>
          <label className={labelClass}>
            Τύπος εκδήλωσης
            <select className={inputClass} name="eventType" required defaultValue="">
              <option value="" disabled>
                Επίλεξε τύπο
              </option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Αριθμός καλεσμένων
            <input className={inputClass} name="guestCount" type="number" min="1" />
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Ενδιαφέρομαι για
            <select className={inputClass} name="interestedIn" defaultValue="">
              <option value="" disabled>
                Επίλεξε υπηρεσία
              </option>
              {interests.map((interest) => (
                <option key={interest} value={interest}>
                  {interest}
                </option>
              ))}
            </select>
          </label>
          <label className={`${labelClass} md:col-span-2`}>
            Μήνυμα / σημειώσεις
            <textarea
              className={`${inputClass} min-h-36 resize-y`}
              name="message"
              placeholder="Μοιράσου ό,τι γνωρίζεις μέχρι στιγμής για το event."
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-7 w-full rounded-full bg-[#0A5458] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0A5458]/15 transition hover:bg-[#07383b] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
        >
          {status === "submitting" ? "Αποστολή..." : "Αποστολή ενδιαφέροντος"}
        </button>
        {status === "success" ? (
          <p className="mt-5 rounded-2xl border border-[#d9b76f]/35 bg-[#f8f2e5] p-4 text-sm leading-6 text-[#3d3a32]" aria-live="polite">
            Το αίτημά σου στάλθηκε με επιτυχία. Θα επικοινωνήσουμε σύντομα μαζί σου.
          </p>
        ) : null}
        {status === "error" ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-[#3d3a32]" aria-live="polite">
            Κάτι πήγε στραβά. Δοκίμασε ξανά ή επικοινώνησε μαζί μας στο sales@veateran.gr.
          </p>
        ) : null}
      </form>

      <aside className="rounded-3xl border border-[#d9b76f]/25 bg-[#0A5458] p-6 text-white shadow-xl shadow-[#0A5458]/10">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#f3d58f]">
          Άμεση επικοινωνία
        </p>
        <h2 className="mt-5 text-2xl font-semibold tracking-tight">
          Προτιμάς να μας μιλήσεις απευθείας;
        </h2>
        <div className="mt-6 space-y-4 text-sm leading-6 text-white/76">
          <p>
            Κάλεσε μας ή στείλε μας τις βασικές πληροφορίες και θα επιστρέψουμε με
            διαθεσιμότητα και πρόταση.
          </p>
          <p>
            Email:{" "}
            <a className="font-semibold text-[#f3d58f]" href="mailto:sales@veateran.gr">
              sales@veateran.gr
            </a>
          </p>
          <p>
            Τηλέφωνο:{" "}
            <a className="font-semibold text-[#f3d58f]" href="tel:+306947005008">
              +30 6947 005 008
            </a>
          </p>
        </div>
      </aside>
    </div>
  );
}
