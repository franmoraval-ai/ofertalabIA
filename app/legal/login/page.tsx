import { redirect } from "next/navigation";

import { currentLegalUser } from "@/lib/legal-auth";

import { LegalLoginForm } from "./signin-form";

export const dynamic = "force-dynamic";

export default async function LegalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await currentLegalUser();
  const params = await searchParams;
  const next = params.next && params.next.startsWith("/") ? params.next : "/legal";
  if (user) {
    redirect(next);
  }
  return <LegalLoginForm next={next} />;
}