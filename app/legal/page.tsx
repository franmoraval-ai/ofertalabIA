import { currentLegalUser } from "@/lib/legal-auth";

import { LegalWorkbenchClient } from "./workbench-client";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function LegalWorkbenchPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const user = await currentLegalUser();
  const resolvedSearchParams = searchParams ? await searchParams : {};
  return (
    <LegalWorkbenchClient
      currentUser={user?.email || ""}
      currentRole={user?.role || "member"}
      initialViewState={{
        search: firstValue(resolvedSearchParams.q),
        ownerFilter: firstValue(resolvedSearchParams.owner),
        institutionFilter: firstValue(resolvedSearchParams.institution),
        slaFilter: firstValue(resolvedSearchParams.sla),
        selectedKey: firstValue(resolvedSearchParams.case),
        selectedCaseKeys: firstValue(resolvedSearchParams.cases),
        bulkAssignee: firstValue(resolvedSearchParams.bulkAssignee),
        bulkStatus: firstValue(resolvedSearchParams.bulkStatus),
        bulkNote: firstValue(resolvedSearchParams.bulkNote),
        bulkNextStep: firstValue(resolvedSearchParams.bulkNextStep),
        bulkTargetDate: firstValue(resolvedSearchParams.bulkTargetDate),
      }}
    />
  );
}