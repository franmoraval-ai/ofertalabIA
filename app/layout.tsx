import type { Metadata } from "next";
import "./globals.css";

const publicSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://ofertalabcr.com";
const metadataBase = new URL(publicSiteUrl);

export const metadata: Metadata = {
  metadataBase,
  title: "OfertaLab IA Clientes",
  description:
    "Oportunidades públicas claras, ofertas profesionales y acompañamiento para ayudar a su empresa a competir.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "OfertaLab IA",
    description: "Su empresa también puede venderle al Estado.",
    locale: "es_CR",
    type: "website",
    url: "/",
    images: [
      {
        url: "/ofertalab-social-card.png",
        width: 1717,
        height: 914,
        alt: "OfertaLab IA: Su empresa también puede venderle al Estado.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OfertaLab IA",
    description: "Su empresa también puede venderle al Estado.",
    images: ["/ofertalab-social-card.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
