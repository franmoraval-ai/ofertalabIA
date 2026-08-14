import type { Metadata } from "next";

import { VerticeLegalClient } from "./vertice-legal-client";

export const metadata: Metadata = {
  metadataBase: new URL("https://vertice.ofertalabcr.com"),
  title: "Vértice Legal | Trámites y acompañamiento",
  description:
    "Gestión clara de trámites, documentos y seguimiento legal para empresas en Costa Rica.",
  alternates: {
    canonical: "/",
  },
};

export default function VerticeLegalPage() {
  return <VerticeLegalClient />;
}