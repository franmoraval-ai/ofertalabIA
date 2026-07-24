import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OfertaLab IA Clientes",
  description:
    "Oportunidades públicas claras, ofertas profesionales y acompañamiento para ayudar a su empresa a competir.",
  openGraph: {
    title: "OfertaLab IA",
    description: "Su empresa también puede venderle al Estado.",
    locale: "es_CR",
    type: "website",
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
