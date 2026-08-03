import { desc, sql } from "drizzle-orm";

import { getDb } from "../../../db";
import { legalCaseEvents, legalCases, portalProfiles, serviceRequests } from "../../../db/schema";
import {
  buildLegalQueue,
  buildLegalQueueSummary,
} from "@/lib/legal-workbench";
import { normalizeLegalCaseBatchPayload } from "./validation";
import { authenticateLegalRequest } from "@/lib/legal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 64_000;

function buildEventId(caseKey: string, updatedAt: string) {
  return `${caseKey}:${updatedAt}`.toLowerCase().slice(0, 240);
}

function buildEventSummary(entry: ReturnType<typeof normalizeLegalCaseBatchPayload>[number]) {
  const pieces = [
    entry.follow_up_status ? `Estado: ${entry.follow_up_status}` : "",
    entry.assigned_to ? `Responsable: ${entry.assigned_to}` : "",
    entry.next_step ? `Paso: ${entry.next_step}` : "",
    entry.target_date ? `Objetivo: ${entry.target_date}` : "",
  ].filter(Boolean);
  return pieces.join(" · ").slice(0, 1_000);
}

export async function GET(request: Request) {
  const auth = await authenticateLegalRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.reason || "No autorizado." }, { status: 401 });
  }

  try {
    const db = getDb();
    const [profiles, requests, cases, events] = await Promise.all([
      db
        .select({
          id: portalProfiles.id,
          company_name: portalProfiles.companyName,
          contact_name: portalProfiles.contactName,
          contact_email: portalProfiles.contactEmail,
          contact_phone: portalProfiles.contactPhone,
          company_website: portalProfiles.companyWebsite,
          company_province: portalProfiles.companyProvince,
          company_experience: portalProfiles.companyExperience,
          company_capacity: portalProfiles.companyCapacity,
          company_products: portalProfiles.companyProducts,
          company_summary: portalProfiles.companySummary,
          created_at: portalProfiles.createdAt,
          updated_at: portalProfiles.updatedAt,
        })
        .from(portalProfiles)
        .orderBy(desc(portalProfiles.updatedAt))
        .limit(5_000),
      db
        .select({
          id: serviceRequests.id,
          opportunity_id: serviceRequests.opportunityId,
          opportunity_title: serviceRequests.opportunityTitle,
          institution: serviceRequests.institution,
          service: serviceRequests.service,
          company_name: serviceRequests.companyName,
          contact_name: serviceRequests.contactName,
          contact_email: serviceRequests.contactEmail,
          contact_phone: serviceRequests.contactPhone,
          company_website: serviceRequests.companyWebsite,
          company_province: serviceRequests.companyProvince,
          company_experience: serviceRequests.companyExperience,
          company_capacity: serviceRequests.companyCapacity,
          company_products: serviceRequests.companyProducts,
          company_summary: serviceRequests.companySummary,
          status: serviceRequests.status,
          created_at: serviceRequests.createdAt,
        })
        .from(serviceRequests)
        .orderBy(desc(serviceRequests.createdAt))
        .limit(5_000),
      db
        .select({
          case_key: legalCases.caseKey,
          company_name: legalCases.companyName,
          contact_email: legalCases.contactEmail,
          follow_up_status: legalCases.followUpStatus,
          assigned_to: legalCases.assignedTo,
          assigned_team: legalCases.assignedTeam,
          note: legalCases.note,
          priority_label: legalCases.priorityLabel,
          next_step: legalCases.nextStep,
          target_date: legalCases.targetDate,
          updated_by: legalCases.updatedBy,
          updated_at: legalCases.updatedAt,
        })
        .from(legalCases)
        .orderBy(desc(legalCases.updatedAt))
        .limit(5_000),
      db
        .select({
          id: legalCaseEvents.id,
          case_key: legalCaseEvents.caseKey,
          event_type: legalCaseEvents.eventType,
          actor_email: legalCaseEvents.actorEmail,
          summary: legalCaseEvents.summary,
          note: legalCaseEvents.note,
          follow_up_status: legalCaseEvents.followUpStatus,
          assigned_to: legalCaseEvents.assignedTo,
          next_step: legalCaseEvents.nextStep,
          target_date: legalCaseEvents.targetDate,
          created_at: legalCaseEvents.createdAt,
        })
        .from(legalCaseEvents)
        .orderBy(desc(legalCaseEvents.createdAt))
        .limit(15_000),
    ]);

    const queue = buildLegalQueue(profiles, requests, cases, events);
    return Response.json({
      count: queue.length,
      summary: buildLegalQueueSummary(queue),
      cases: queue,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudieron leer los casos legales.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await authenticateLegalRequest(request);
  if (!auth.ok) {
    return Response.json({ error: auth.reason || "No autorizado." }, { status: 401 });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ error: "La actualización del caso es demasiado grande." }, { status: 413 });
  }

  try {
    const entries = normalizeLegalCaseBatchPayload(raw ? JSON.parse(raw) : {});
    const db = getDb();
    await db
      .insert(legalCases)
      .values(
        entries.map((entry) => ({
          caseKey: entry.case_key,
          companyName: entry.company_name,
          contactEmail: entry.contact_email,
          followUpStatus: entry.follow_up_status,
          assignedTo: entry.assigned_to,
          assignedTeam: entry.assigned_team,
          note: entry.note,
          priorityLabel: entry.priority_label,
          nextStep: entry.next_step,
          targetDate: entry.target_date,
          updatedBy: entry.updated_by,
          updatedAt: entry.updated_at,
        })),
      )
      .onConflictDoUpdate({
        target: legalCases.caseKey,
        set: {
          companyName: sql`coalesce(nullif(excluded.company_name, ''), ${legalCases.companyName})`,
          contactEmail: sql`coalesce(nullif(excluded.contact_email, ''), ${legalCases.contactEmail})`,
          followUpStatus: sql`excluded.follow_up_status`,
          assignedTo: sql`coalesce(nullif(excluded.assigned_to, ''), ${legalCases.assignedTo})`,
          assignedTeam: sql`coalesce(nullif(excluded.assigned_team, ''), ${legalCases.assignedTeam})`,
          note: sql`excluded.note`,
          priorityLabel: sql`coalesce(nullif(excluded.priority_label, ''), ${legalCases.priorityLabel})`,
          nextStep: sql`coalesce(nullif(excluded.next_step, ''), ${legalCases.nextStep})`,
          targetDate: sql`coalesce(nullif(excluded.target_date, ''), ${legalCases.targetDate})`,
          updatedBy: sql`coalesce(nullif(excluded.updated_by, ''), ${legalCases.updatedBy})`,
          updatedAt: sql`excluded.updated_at`,
        },
      });
    await db.insert(legalCaseEvents).values(
      entries.map((entry) => ({
        id: buildEventId(entry.case_key, entry.updated_at),
        caseKey: entry.case_key,
        eventType: "updated",
        actorEmail: auth.user.email,
        summary: buildEventSummary(entry),
        note: entry.note,
        followUpStatus: entry.follow_up_status,
        assignedTo: entry.assigned_to,
        nextStep: entry.next_step,
        targetDate: entry.target_date,
        createdAt: entry.updated_at,
      })),
    ).onConflictDoNothing();
    return Response.json({ saved: true, count: entries.length }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "No se pudo guardar el caso legal.";
    return Response.json({ error: message }, { status: 400 });
  }
}