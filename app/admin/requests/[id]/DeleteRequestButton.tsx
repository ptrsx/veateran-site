"use client";

import { type FormEvent } from "react";

export function DeleteRequestButton({ action }: { action: () => Promise<void> }) {
  function confirmDelete(event: FormEvent<HTMLFormElement>) {
    if (!window.confirm("Θέλεις σίγουρα να διαγράψεις αυτό το αίτημα;")) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={confirmDelete}>
      <button
        className="rounded-full border border-red-200 px-5 py-3 text-sm font-bold text-red-700 transition hover:bg-red-50"
        type="submit"
      >
        Διαγραφή αιτήματος
      </button>
    </form>
  );
}
