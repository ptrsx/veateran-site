import type { Metadata } from "next";
import "./globals.css";

const title = "The VeatERAN Van | Vintage Catering & Bar Van για Events";
const description =
  "Vintage mobile catering & bar van με βάση την Αθήνα για γάμους, βαπτίσεις, parties και εταιρικά events. Street food, cocktails και πλήρως εξοπλισμένο setup στον χώρο σου.";
const siteUrl = "https://veateran-site.vercel.app";
const ogImage = "/images/og-veateran.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "The VeatERAN Van",
    locale: "el_GR",
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        type: "image/jpeg",
        alt: "The VeatERAN Van vintage catering and bar van",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
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
