"use client";

import { FormEvent, useState } from "react";

import { customerTypeLabels, quoteRequestCustomerTypes } from "@/lib/crm/customerType";
import {
  getQuoteMenuItemsByCategory,
  quoteMenuCategoryLabels,
  quoteMenuItems,
  type QuoteMenuItemCategory,
} from "@/lib/crm/menuItems";
import type { QuoteRequestCustomerType } from "@/lib/crm/types";

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

const menuCategories: QuoteMenuItemCategory[] = ["food", "drinks"];

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#d9b76f]/25 bg-white/80 px-4 py-3 text-sm text-[#171717] outline-none transition placeholder:text-[#7a7468] focus:border-[#0A5458] focus:ring-4 focus:ring-[#0A5458]/10";

const labelClass = "text-sm font-semibold text-[#0A5458]";

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function RequestQuoteForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [customerType, setCustomerType] = useState<QuoteRequestCustomerType>("individual");
  const [invoiceRequired, setInvoiceRequired] = useState(false);
  const [menuExpanded, setMenuExpanded] = useState(false);
  const [selectedMenuItemIds, setSelectedMenuItemIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  function handleCustomerTypeChange(type: QuoteRequestCustomerType) {
    setCustomerType(type);
    setStatus("idle");
    setErrorMessage("");

    if (type === "individual") {
      setInvoiceRequired(false);
    }
  }

  function handleMenuItemChange(itemId: string, checked: boolean) {
    setSelectedMenuItemIds((currentIds) => {
      if (checked) {
        return currentIds.includes(itemId) ? currentIds : [...currentIds, itemId];
      }

      return currentIds.filter((currentId) => currentId !== itemId);
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const selectedMenuItems = quoteMenuItems.filter((item) => selectedMenuItemIds.includes(item.id));

    setStatus("submitting");
    setErrorMessage("");

    const commonPayload = {
      eventDate: getFormString(formData, "eventDate"),
      eventLocation: getFormString(formData, "eventLocation"),
      eventType: getFormString(formData, "eventType"),
      guestCount: getFormString(formData, "guestCount"),
      interestedIn: getFormString(formData, "interestedIn"),
      message: getFormString(formData, "message"),
      selectedMenuItems,
    };

    let payload: Record<string, unknown>;

    if (customerType === "business") {
      const businessName = getFormString(formData, "businessName");
      const businessVat = getFormString(formData, "businessVat");
      const businessTaxOffice = getFormString(formData, "businessTaxOffice");
      const businessAddress = getFormString(formData, "businessAddress");
      const contactName = getFormString(formData, "contactName");
      const contactPhone = getFormString(formData, "contactPhone");
      const contactEmail = getFormString(formData, "contactEmail");
      const missingContact = !contactPhone && !contactEmail;
      const missingInvoiceDetails =
        invoiceRequired && (!businessVat || !businessTaxOffice || !businessAddress);

      if (!businessName || !contactName || missingContact || missingInvoiceDetails) {
        setStatus("error");
        setErrorMessage("Συμπλήρωσε τα απαραίτητα στοιχεία επιχείρησης και επαφής.");
        return;
      }

      payload = {
        ...commonPayload,
        customerType: "business",
        businessName,
        businessVat,
        businessTaxOffice,
        businessAddress,
        contactName,
        contactPhone,
        contactEmail,
        invoiceRequired,
      };
    } else {
      payload = {
        ...commonPayload,
        customerType: "individual",
        name: getFormString(formData, "name"),
        phone: getFormString(formData, "phone"),
        email: getFormString(formData, "email"),
        invoiceRequired: false,
      };
    }

    let response: Response;

    try {
      response = await fetch("/api/request-quote", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
    } catch {
      setStatus("error");
      setErrorMessage("Κάτι πήγε στραβά. Δοκίμασε ξανά ή επικοινώνησε μαζί μας στο sales@veateran.gr.");
      return;
    }

    if (response.ok) {
      form.reset();
      setCustomerType("individual");
      setInvoiceRequired(false);
      setMenuExpanded(false);
      setSelectedMenuItemIds([]);
      setErrorMessage("");
      setStatus("success");
      return;
    }

    setStatus("error");
    setErrorMessage("Κάτι πήγε στραβά. Δοκίμασε ξανά ή επικοινώνησε μαζί μας στο sales@veateran.gr.");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_0.42fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-[#d9b76f]/25 bg-white/75 p-5 shadow-xl shadow-[#0A5458]/5 sm:p-8"
      >
        <input name="customerType" type="hidden" value={customerType} />

        <section>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#0A5458]">Τύπος πελάτη</h2>
              <p className="mt-2 text-sm leading-6 text-[#5f594f]">
                Επίλεξε αν το αίτημα αφορά ιδιώτη ή επιχείρηση.
              </p>
            </div>
            <div className="grid overflow-hidden rounded-full border border-[#d9b76f]/35 bg-[#fffaf0] p-1 sm:grid-cols-2">
              {quoteRequestCustomerTypes.map((type) => {
                const selected = customerType === type;

                return (
                  <button
                    aria-pressed={selected}
                    className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                      selected
                        ? "bg-[#0A5458] text-white shadow-sm"
                        : "text-[#0A5458] hover:bg-[#0A5458]/10"
                    }`}
                    key={type}
                    onClick={() => handleCustomerTypeChange(type)}
                    type="button"
                  >
                    {customerTypeLabels[type]}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {customerType === "individual" ? (
          <section className="mt-8 border-t border-[#d9b76f]/20 pt-6">
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
            </div>
          </section>
        ) : (
          <>
            <section className="mt-8 border-t border-[#d9b76f]/20 pt-6">
              <h2 className="text-xl font-semibold text-[#0A5458]">Στοιχεία επιχείρησης</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className={labelClass}>
                  Επωνυμία
                  <input className={inputClass} name="businessName" type="text" required />
                </label>
                <label className={labelClass}>
                  ΑΦΜ
                  <input className={inputClass} name="businessVat" required={invoiceRequired} type="text" />
                </label>
                <label className={labelClass}>
                  ΔΟΥ
                  <input className={inputClass} name="businessTaxOffice" required={invoiceRequired} type="text" />
                </label>
                <label className={labelClass}>
                  Διεύθυνση
                  <input className={inputClass} name="businessAddress" required={invoiceRequired} type="text" />
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-[#d9b76f]/25 bg-[#fffaf0]/75 px-4 py-3 text-sm font-semibold text-[#0A5458] md:col-span-2">
                  <input
                    checked={invoiceRequired}
                    className="h-4 w-4 accent-[#0A5458]"
                    name="invoiceRequired"
                    onChange={(event) => setInvoiceRequired(event.target.checked)}
                    type="checkbox"
                    value="1"
                  />
                  Έκδοση τιμολογίου
                </label>
              </div>
            </section>

            <section className="mt-8 border-t border-[#d9b76f]/20 pt-6">
              <h2 className="text-xl font-semibold text-[#0A5458]">Στοιχεία επαφής</h2>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <label className={labelClass}>
                  Όνομα επαφής
                  <input className={inputClass} name="contactName" type="text" required />
                </label>
                <label className={labelClass}>
                  Τηλέφωνο επαφής
                  <input className={inputClass} name="contactPhone" type="tel" />
                </label>
                <label className={labelClass}>
                  Email επαφής
                  <input className={inputClass} name="contactEmail" type="email" />
                </label>
              </div>
            </section>
          </>
        )}

        <section className="mt-8 border-t border-[#d9b76f]/20 pt-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className={labelClass}>
              Ημερομηνία εκδήλωσης
              <input className={inputClass} name="eventDate" type="date" />
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
            <label className={`${labelClass} md:col-span-2`}>
              Τοποθεσία εκδήλωσης
              <input className={inputClass} name="eventLocation" type="text" />
            </label>
            <label className={labelClass}>
              Αριθμός καλεσμένων
              <input className={inputClass} name="guestCount" type="number" min="1" />
            </label>
            <label className={labelClass}>
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
        </section>

        <section className="mt-8 border-t border-[#d9b76f]/20 pt-6">
          <button
            aria-expanded={menuExpanded}
            className="flex w-full items-center justify-between gap-4 rounded-2xl border border-[#d9b76f]/30 bg-[#fffaf0]/80 px-4 py-4 text-left text-[#0A5458] transition hover:bg-[#f8f2e5]"
            onClick={() => setMenuExpanded((expanded) => !expanded)}
            type="button"
          >
            <span>
              <span className="block text-lg font-semibold">Επιλέξτε το δικό σας μενού</span>
              <span className="mt-1 block text-sm leading-6 text-[#5f594f]">
                Προαιρετικά, επίλεξε όσα σε ενδιαφέρουν ώστε να ετοιμάσουμε πιο στοχευμένη προσφορά.
              </span>
            </span>
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0A5458] text-lg font-bold text-white">
              {menuExpanded ? "-" : "+"}
            </span>
          </button>

          {menuExpanded ? (
            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              {menuCategories.map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-[#0A5458]">
                    {quoteMenuCategoryLabels[category]}
                  </h3>
                  <div className="mt-3 grid gap-2">
                    {getQuoteMenuItemsByCategory(category).map((item) => (
                      <label
                        className="flex items-center gap-3 rounded-2xl border border-[#d9b76f]/20 bg-white/70 px-4 py-3 text-sm font-semibold text-[#2f2b25] transition hover:border-[#0A5458]/40"
                        key={item.id}
                      >
                        <input
                          checked={selectedMenuItemIds.includes(item.id)}
                          className="h-4 w-4 accent-[#0A5458]"
                          name="selectedMenuItemIds"
                          onChange={(event) => handleMenuItemChange(item.id, event.target.checked)}
                          type="checkbox"
                          value={item.id}
                        />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

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
            {errorMessage || "Κάτι πήγε στραβά. Δοκίμασε ξανά ή επικοινώνησε μαζί μας στο sales@veateran.gr."}
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
