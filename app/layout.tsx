import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The VeatERAN Van | Mobile Catering & Bar Van για Events",
  description:
    "Vintage mobile catering & bar van με βάση την Αθήνα για γάμους, βαπτίσεις, parties και εταιρικά events. Street food, cocktails και πλήρως εξοπλισμένο setup στον χώρο σου.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
