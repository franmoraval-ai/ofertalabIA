"use client";

import { useEffect, useMemo, useState } from "react";

type LegalCase = {
  case_key: string;
  status: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  company_website: string;
  company_province: string;
  company_experience: string;
  company_capacity: string;
  company_products: string;
  company_summary: string;
  request_count: number;
  latest_request_service: string;
  latest_request_status: string;
  latest_request_at: string;
  latest_opportunity_id: string;
  latest_opportunity_title: string;
  latest_institution: string;
  legal_label: string;
  legal_tone: "good" | "warn" | "risk";
  follow_up_status: string;
  assigned_to: string;
  assigned_team: string;
  note: string;
  priority_label: string;
  next_step: string;
  target_date: string;
  updated_by: string;
  updated_at: string;
  sla_bucket: "critico" | "hoy" | "esta-semana" | "estable";
  urgency_label: string;
  age_days: number;
  timeline: Array<{
    id: string;
    event_type: string;
    actor_email: string;
    summary: string;
    note: string;
    follow_up_status: string;
    assigned_to: string;
    next_step: string;
    target_date: string;
    created_at: string;
  }>;
};

type LegalQueueResponse = {
  count: number;
  summary: string;
  cases: LegalCase[];
};

type LegalStaffMember = {
  email: string;
  full_name: string;
  team: string;
  role: string;
  active: string;
  created_at: string;
  updated_at: string;
};

type LegalStaffResponse = {
  count: number;
  staff: LegalStaffMember[];
};

type LegalReadinessResponse = {
  env: Array<{
    name: string;
    present: boolean;
    message: string;
  }>;
  database_ready: boolean;
  database_message: string;
  staff_count: number;
  user_management_ready: boolean;
  next_steps: string[];
};

const FOLLOW_UP_OPTIONS = [
  "Sin estado",
  "Pendiente contacto",
  "En revisión",
  "Documentos recibidos",
  "Listo para oferta",
];

const BULK_NOTE_TEMPLATES = [
  "",
  "Se envió recordatorio al cliente para completar documentos base.",
  "Se asignó revisión interna del expediente y validación documental.",
  "Se programó seguimiento para confirmar faltantes y próximos pasos.",
  "Se dejó caso listo para coordinación final de oferta.",
];

const BULK_NEXT_STEP_TEMPLATES = [
  "",
  "Contactar al cliente y pedir documentos legales base.",
  "Revisar pliego, riesgos y documentos recibidos.",
  "Validar vigencia y brechas de los documentos enviados.",
  "Coordinar cierre legal y presentación de la oferta.",
];

const VIEW_STATE_STORAGE_KEY = "ofertalab-legal-workbench-view";

export type LegalWorkbenchViewState = {
  search?: string;
  ownerFilter?: string;
  institutionFilter?: string;
  slaFilter?: string;
  selectedKey?: string;
  selectedCaseKeys?: string;
  bulkAssignee?: string;
  bulkStatus?: string;
  bulkNote?: string;
  bulkNextStep?: string;
  bulkTargetDate?: string;
};

function parseSelectedCaseKeys(value: string | undefined) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(value: string) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function LegalWorkbenchClient({
  currentUser,
  currentRole,
  initialViewState,
}: {
  currentUser: string;
  currentRole: string;
  initialViewState?: LegalWorkbenchViewState;
}) {
  const [queue, setQueue] = useState<LegalCase[]>([]);
  const [staff, setStaff] = useState<LegalStaffMember[]>([]);
  const [summary, setSummary] = useState("Cargando casos legales...");
  const [search, setSearch] = useState(initialViewState?.search || "");
  const [ownerFilter, setOwnerFilter] = useState(initialViewState?.ownerFilter || "Todos");
  const [institutionFilter, setInstitutionFilter] = useState(initialViewState?.institutionFilter || "Todas");
  const [slaFilter, setSlaFilter] = useState(initialViewState?.slaFilter || "Todos");
  const [selectedKey, setSelectedKey] = useState(initialViewState?.selectedKey || "");
  const [selectedCaseKeys, setSelectedCaseKeys] = useState<string[]>(() => parseSelectedCaseKeys(initialViewState?.selectedCaseKeys));
  const [bulkAssignee, setBulkAssignee] = useState(initialViewState?.bulkAssignee || "");
  const [bulkStatus, setBulkStatus] = useState(initialViewState?.bulkStatus || "");
  const [bulkNote, setBulkNote] = useState(initialViewState?.bulkNote || "");
  const [bulkNextStep, setBulkNextStep] = useState(initialViewState?.bulkNextStep || "");
  const [bulkTargetDate, setBulkTargetDate] = useState(initialViewState?.bulkTargetDate || "");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingStaff, setSavingStaff] = useState(false);
  const [savingBulk, setSavingBulk] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [staffError, setStaffError] = useState("");
  const [staffSuccess, setStaffSuccess] = useState("");
  const [readiness, setReadiness] = useState<LegalReadinessResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const requests = [
          fetch("/api/legal-cases", { cache: "no-store" }),
          fetch("/api/legal-staff", { cache: "no-store" }),
        ];
        if (currentRole === "admin") {
          requests.push(fetch("/api/legal-readiness", { cache: "no-store" }));
        }
        const [casesResponse, staffResponse, readinessResponse] = await Promise.all(requests);
        const payload = (await casesResponse.json()) as LegalQueueResponse & { error?: string };
        const staffPayload = (await staffResponse.json()) as LegalStaffResponse & { error?: string };
        if (!casesResponse.ok) {
          throw new Error(payload.error || "No se pudieron leer los casos legales.");
        }
        if (!staffResponse.ok) {
          throw new Error(staffPayload.error || "No se pudo leer el equipo legal.");
        }
        let readinessPayload: LegalReadinessResponse | null = null;
        if (readinessResponse) {
          const parsed = (await readinessResponse.json()) as LegalReadinessResponse & { error?: string };
          if (!readinessResponse.ok) {
            throw new Error(parsed.error || "No se pudo leer el estado de despliegue.");
          }
          readinessPayload = parsed;
        }
        if (cancelled) return;
        setQueue(payload.cases || []);
        setStaff(staffPayload.staff || []);
        setReadiness(readinessPayload);
        setSummary(payload.summary || "Sin resumen disponible.");
        setSelectedKey((current) => current || payload.cases?.[0]?.case_key || "");
      } catch (caughtError) {
        if (!cancelled) {
          setError(caughtError instanceof Error ? caughtError.message : "No se pudo cargar Mesa Legal.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [currentRole]);

  const owners = useMemo(() => {
    const values = Array.from(
      new Set(
        [
          ...queue.map((entry) => entry.assigned_to.trim()),
          ...staff.filter((entry) => entry.active !== "false").map((entry) => entry.full_name.trim()),
        ].filter(Boolean),
      ),
    ).sort((left, right) => left.localeCompare(right, "es"));
    return ["Todos", "Sin responsable", ...values];
  }, [queue, staff]);

  const staffOptions = useMemo(() => {
    return staff
      .filter((entry) => entry.active !== "false")
      .sort((left, right) => left.full_name.localeCompare(right.full_name, "es"));
  }, [staff]);

  const institutions = useMemo(() => {
    const values = Array.from(
      new Set(queue.map((entry) => entry.latest_institution.trim()).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right, "es"));
    return ["Todas", ...values];
  }, [queue]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return queue.filter((entry) => {
      const matchesOwner =
        ownerFilter === "Todos"
          ? true
          : ownerFilter === "Sin responsable"
            ? !entry.assigned_to.trim()
            : entry.assigned_to.trim() === ownerFilter;
      if (!matchesOwner) return false;
      const matchesInstitution =
        institutionFilter === "Todas"
          ? true
          : (entry.latest_institution.trim() || "Sin institución") === institutionFilter;
      if (!matchesInstitution) return false;
      const matchesSla = slaFilter === "Todos" ? true : entry.sla_bucket === slaFilter;
      if (!matchesSla) return false;
      if (!needle) return true;
      return [
        entry.company_name,
        entry.contact_name,
        entry.contact_email,
        entry.latest_opportunity_id,
        entry.latest_opportunity_title,
        entry.latest_institution,
        entry.legal_label,
        entry.follow_up_status,
        entry.next_step,
        entry.assigned_to,
        entry.urgency_label,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [institutionFilter, ownerFilter, queue, search, slaFilter]);

  const caseMetrics = useMemo(() => {
    return {
      critical: queue.filter((entry) => entry.sla_bucket === "critico").length,
      today: queue.filter((entry) => entry.sla_bucket === "hoy").length,
      unassigned: queue.filter((entry) => !entry.assigned_to.trim()).length,
      ready: queue.filter((entry) => entry.legal_label === "Listo para Legal").length,
    };
  }, [queue]);

  const activeSelectedKey = filtered.some((entry) => entry.case_key === selectedKey)
    ? selectedKey
    : (filtered[0]?.case_key || "");
  const selected = filtered.find((entry) => entry.case_key === activeSelectedKey) || null;
  const assigneeOptions = useMemo(() => {
    const values = new Set(staffOptions.map((entry) => entry.full_name));
    if (selected?.assigned_to?.trim()) {
      values.add(selected.assigned_to.trim());
    }
    return Array.from(values).sort((left, right) => left.localeCompare(right, "es"));
  }, [selected, staffOptions]);

  const selectedBulkCases = useMemo(
    () => queue.filter((entry) => selectedCaseKeys.includes(entry.case_key)),
    [queue, selectedCaseKeys],
  );

  const totalSelectedFiltered = filtered.filter((entry) => selectedCaseKeys.includes(entry.case_key)).length;
  const allFilteredSelected = filtered.length > 0 && totalSelectedFiltered === filtered.length;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const viewState = {
      search,
      ownerFilter,
      institutionFilter,
      slaFilter,
      selectedKey: activeSelectedKey,
      selectedCaseKeys: selectedCaseKeys.join(","),
      bulkAssignee,
      bulkStatus,
      bulkNote,
      bulkNextStep,
      bulkTargetDate,
    } satisfies LegalWorkbenchViewState;
    window.localStorage.setItem(VIEW_STATE_STORAGE_KEY, JSON.stringify(viewState));

    const params = new URLSearchParams(window.location.search);
    const assign = (key: string, value: string, defaultValue: string) => {
      if (!value || value === defaultValue) {
        params.delete(key);
        return;
      }
      params.set(key, value);
    };

    assign("q", search, "");
    assign("owner", ownerFilter, "Todos");
    assign("institution", institutionFilter, "Todas");
    assign("sla", slaFilter, "Todos");
    assign("case", activeSelectedKey, "");
    assign("cases", selectedCaseKeys.join(","), "");
    assign("bulkAssignee", bulkAssignee, "");
    assign("bulkStatus", bulkStatus, "");
    assign("bulkNote", bulkNote, "");
    assign("bulkNextStep", bulkNextStep, "");
    assign("bulkTargetDate", bulkTargetDate, "");

    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ""}`;
    window.history.replaceState(null, "", nextUrl);
  }, [activeSelectedKey, bulkAssignee, bulkNextStep, bulkNote, bulkStatus, bulkTargetDate, institutionFilter, ownerFilter, search, selectedCaseKeys, slaFilter]);

  function mergeBulkNote(existingNote: string, nextNote: string) {
    const base = existingNote.trim();
    const addition = nextNote.trim();
    if (!addition) return base;
    if (!base) return addition;
    return `${base}\n\n${addition}`.slice(0, 8_000);
  }

  function patchQueueCases(
    caseKeys: string[],
    changes: {
      assignedTo?: string;
      followUpStatus?: string;
      noteByCaseKey?: Record<string, string>;
      nextStep?: string;
      targetDate?: string;
    },
    updatedAt: string,
    updatedBy: string,
  ) {
    setQueue((current) =>
      current.map((entry) =>
        caseKeys.includes(entry.case_key)
          ? {
              ...entry,
              assigned_to: changes.assignedTo ?? entry.assigned_to,
              follow_up_status: changes.followUpStatus ?? entry.follow_up_status,
              note: changes.noteByCaseKey?.[entry.case_key] ?? entry.note,
              next_step: changes.nextStep ?? entry.next_step,
              target_date: changes.targetDate ?? entry.target_date,
              updated_at: updatedAt,
              updated_by: updatedBy,
              timeline: [
                {
                  id: `${entry.case_key}:${updatedAt}`,
                  event_type: "updated",
                  actor_email: updatedBy,
                  summary: `Estado: ${changes.followUpStatus ?? entry.follow_up_status} · Responsable: ${(changes.assignedTo ?? entry.assigned_to) || "Sin responsable"} · Paso: ${changes.nextStep ?? entry.next_step}${changes.targetDate ? ` · Objetivo: ${changes.targetDate}` : ""}`,
                  note: changes.noteByCaseKey?.[entry.case_key] ?? entry.note,
                  follow_up_status: changes.followUpStatus ?? entry.follow_up_status,
                  assigned_to: changes.assignedTo ?? entry.assigned_to,
                  next_step: changes.nextStep ?? entry.next_step,
                  target_date: changes.targetDate ?? entry.target_date,
                  created_at: updatedAt,
                },
                ...(entry.timeline || []),
              ],
            }
          : entry,
      ),
    );
  }

  function toggleCaseSelection(caseKey: string) {
    setSelectedCaseKeys((current) =>
      current.includes(caseKey) ? current.filter((entry) => entry !== caseKey) : [...current, caseKey],
    );
  }

  function toggleSelectFiltered() {
    if (allFilteredSelected) {
      const filteredKeys = new Set(filtered.map((entry) => entry.case_key));
      setSelectedCaseKeys((current) => current.filter((entry) => !filteredKeys.has(entry)));
      return;
    }
    setSelectedCaseKeys((current) => {
      const next = new Set(current);
      for (const entry of filtered) {
        next.add(entry.case_key);
      }
      return Array.from(next);
    });
  }

  function clearQuickFilters() {
    setOwnerFilter("Todos");
    setInstitutionFilter("Todas");
    setSlaFilter("Todos");
  }

  async function saveCase(formData: FormData) {
    if (!selected) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        case_key: selected.case_key,
        company_name: selected.company_name,
        contact_email: selected.contact_email,
        follow_up_status: String(formData.get("follow_up_status") || "Sin estado"),
        assigned_to: String(formData.get("assigned_to") || ""),
        assigned_team: "Legal",
        note: String(formData.get("note") || ""),
        priority_label: selected.legal_label,
        next_step: String(formData.get("next_step") || selected.next_step || ""),
        target_date: String(formData.get("target_date") || "").trim(),
        updated_by: currentUser,
      };
      const response = await fetch("/api/legal-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string; auth_user_id?: string; auth_email?: string };
      if (!response.ok) {
        throw new Error(body.error || "No se pudo guardar el caso legal.");
      }
      setQueue((current) =>
        current.map((entry) =>
          entry.case_key === selected.case_key
            ? {
                ...entry,
                follow_up_status: payload.follow_up_status,
                assigned_to: payload.assigned_to,
                note: payload.note,
                next_step: payload.next_step,
                target_date: payload.target_date,
                updated_by: currentUser,
                updated_at: new Date().toISOString(),
                timeline: [
                  {
                    id: `${selected.case_key}:${new Date().toISOString()}`,
                    event_type: "updated",
                    actor_email: currentUser,
                    summary: `Estado: ${payload.follow_up_status} · Responsable: ${payload.assigned_to || "Sin responsable"} · Paso: ${payload.next_step}${payload.target_date ? ` · Objetivo: ${payload.target_date}` : ""}`,
                    note: payload.note,
                    follow_up_status: payload.follow_up_status,
                    assigned_to: payload.assigned_to,
                    next_step: payload.next_step,
                    target_date: payload.target_date,
                    created_at: new Date().toISOString(),
                  },
                  ...(entry.timeline || []),
                ],
              }
            : entry,
        ),
      );
      setSuccess("Caso legal actualizado.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await fetch("/api/legal-session", { method: "DELETE" });
    window.location.href = "/legal/login";
  }

  async function inviteLegalUser(formData: FormData) {
    setSavingStaff(true);
    setStaffError("");
    setStaffSuccess("");
    try {
      const payload = {
        email: String(formData.get("email") || "").trim(),
        full_name: String(formData.get("full_name") || "").trim(),
        team: String(formData.get("team") || "").trim() || "Legal",
        role: String(formData.get("role") || "member").trim() || "member",
      };
      const response = await fetch("/api/legal-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "No se pudo enviar la invitación.");
      }
      const now = new Date().toISOString();
      setStaff((current) => {
        const next = current.filter((entry) => entry.email !== payload.email.toLowerCase());
        next.push({
          email: payload.email.toLowerCase(),
          full_name: payload.full_name,
          team: payload.team,
          role: payload.role,
          active: "true",
          created_at: now,
          updated_at: now,
        });
        return next.sort((left, right) => left.full_name.localeCompare(right.full_name, "es"));
      });
      setStaffSuccess(
        `Cuenta creada para ${body.auth_email || payload.email}. ID de Supabase: ${body.auth_user_id || "no disponible"}. La persona recibirá un correo para activar su acceso.`,
      );
    } catch (caughtError) {
      setStaffError(caughtError instanceof Error ? caughtError.message : "No se pudo invitar al responsable.");
    } finally {
      setSavingStaff(false);
    }
  }

  async function bulkAssignCases() {
    if (!selectedBulkCases.length) {
      setError("Seleccione al menos un caso para reasignar.");
      return;
    }
    if (!bulkAssignee && !bulkStatus && !bulkNote.trim() && !bulkNextStep.trim() && !bulkTargetDate.trim()) {
      setError("Defina un responsable, un estado, una nota, un siguiente paso o una fecha objetivo para aplicar la acción masiva.");
      return;
    }
    setSavingBulk(true);
    setError("");
    setSuccess("");
    try {
      const updatedAt = new Date().toISOString();
      const noteByCaseKey = Object.fromEntries(
        selectedBulkCases.map((entry) => [entry.case_key, mergeBulkNote(entry.note, bulkNote)]),
      );
      const payload = {
        cases: selectedBulkCases.map((entry) => ({
          case_key: entry.case_key,
          company_name: entry.company_name,
          contact_email: entry.contact_email,
          follow_up_status: bulkStatus || entry.follow_up_status,
          assigned_to: bulkAssignee || entry.assigned_to,
          assigned_team: "Legal",
          note: noteByCaseKey[entry.case_key],
          priority_label: entry.legal_label,
          next_step: bulkNextStep || entry.next_step,
          target_date: bulkTargetDate || entry.target_date,
          updated_by: currentUser,
          updated_at: updatedAt,
        })),
      };
      const response = await fetch("/api/legal-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(body.error || "No se pudieron reasignar los casos.");
      }
      patchQueueCases(
        selectedBulkCases.map((entry) => entry.case_key),
        {
          assignedTo: bulkAssignee || undefined,
          followUpStatus: bulkStatus || undefined,
          noteByCaseKey: bulkNote.trim() ? noteByCaseKey : undefined,
          nextStep: bulkNextStep || undefined,
          targetDate: bulkTargetDate || undefined,
        },
        updatedAt,
        currentUser,
      );
      setSuccess(`Se actualizaron ${selectedBulkCases.length} caso(s).`);
      setSelectedCaseKeys([]);
      setBulkAssignee("");
      setBulkStatus("");
      setBulkNote("");
      setBulkNextStep("");
      setBulkTargetDate("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "No se pudo aplicar la reasignación masiva.");
    } finally {
      setSavingBulk(false);
    }
  }

  return (
    <main className="legal-shell">
      <section className="legal-header-card">
        <div>
          <p className="legal-eyebrow">Operación interna</p>
          <h1>Mesa Legal</h1>
          <p className="legal-subcopy">
            Atienda los casos pendientes, asigne un responsable y reúna la información necesaria antes de avanzar con una contratación.
          </p>
        </div>
        <div className="legal-user-block">
          <strong>{currentUser || "Usuario interno"}</strong>
          <span>Rol: {currentRole}</span>
          <button className="secondary" onClick={() => void logout()}>
            Cerrar sesión
          </button>
        </div>
      </section>

      <section className="legal-summary-card">
        <div>
          <p className="legal-eyebrow">Bandeja de hoy</p>
          <strong>{summary}</strong>
          <p>Seleccione un caso para revisar el cliente, la contratación registrada y el siguiente paso legal.</p>
        </div>
        <div className="legal-toolbar">
          <input
            className="legal-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar empresa, contratación o institución"
            aria-label="Buscar casos legales"
          />
          <select
            className="legal-owner-filter"
            value={ownerFilter}
            onChange={(event) => setOwnerFilter(event.target.value)}
          >
            {owners.map((owner) => (
              <option key={owner} value={owner}>{owner}</option>
            ))}
          </select>
          <select
            className="legal-owner-filter"
            value={institutionFilter}
            onChange={(event) => setInstitutionFilter(event.target.value)}
          >
            {institutions.map((institution) => (
              <option key={institution} value={institution}>{institution}</option>
            ))}
          </select>
          <select
            className="legal-owner-filter"
            value={slaFilter}
            onChange={(event) => setSlaFilter(event.target.value)}
          >
            <option value="Todos">Todos los SLA</option>
            <option value="critico">Critico</option>
            <option value="hoy">Atender hoy</option>
            <option value="esta-semana">Esta semana</option>
            <option value="estable">Estable</option>
          </select>
          <button className="secondary" type="button" onClick={() => clearQuickFilters()}>
            Limpiar filtros
          </button>
        </div>
      </section>

      <section className="legal-metric-grid" aria-label="Resumen de casos">
        <button className={`legal-metric-card critical ${slaFilter === "critico" ? "active" : ""}`} type="button" onClick={() => setSlaFilter("critico")}>
          <span>Críticos</span>
          <strong>{caseMetrics.critical}</strong>
          <small>Requieren movimiento inmediato</small>
        </button>
        <button className={`legal-metric-card today ${slaFilter === "hoy" ? "active" : ""}`} type="button" onClick={() => setSlaFilter("hoy")}>
          <span>Atender hoy</span>
          <strong>{caseMetrics.today}</strong>
          <small>Con revisión o fecha próxima</small>
        </button>
        <button className={`legal-metric-card ${ownerFilter === "Sin responsable" ? "active" : ""}`} type="button" onClick={() => setOwnerFilter("Sin responsable")}>
          <span>Sin responsable</span>
          <strong>{caseMetrics.unassigned}</strong>
          <small>Asigne un caso para iniciar</small>
        </button>
        <button className={`legal-metric-card ready ${search === "Listo para Legal" ? "active" : ""}`} type="button" onClick={() => { setSearch("Listo para Legal"); setSlaFilter("Todos"); setOwnerFilter("Todos"); }}>
          <span>Listos para Legal</span>
          <strong>{caseMetrics.ready}</strong>
          <small>Con ficha suficiente para revisión</small>
        </button>
      </section>

      {error ? <p className="legal-error-banner">{error}</p> : null}
      {success ? <p className="legal-success-banner">{success}</p> : null}
      {staffError ? <p className="legal-error-banner">{staffError}</p> : null}
      {staffSuccess ? <p className="legal-success-banner">{staffSuccess}</p> : null}

      {currentRole === "admin" ? (
        <>
          <section className="legal-readiness-card">
            <div className="legal-list-head">
              <h2>Estado de Mesa Legal</h2>
              <span>{readiness?.database_ready ? "Lista" : "Revisión requerida"}</span>
            </div>
            <div className="legal-readiness-summary">
              <p>{readiness?.database_message || "Sin lectura de despliegue todavía."}</p>
              <p>Equipo cargado: {readiness?.staff_count || 0}</p>
              <p>
                {readiness?.user_management_ready
                  ? "Las invitaciones se pueden enviar desde esta mesa."
                  : "Las invitaciones estarán disponibles al configurar SUPABASE_SECRET_KEY en el servidor."}
              </p>
              {(readiness?.next_steps || []).map((step) => (
                <p key={step}>{step}</p>
              ))}
            </div>
          </section>

          <section className="legal-admin-card">
            <div className="legal-list-head">
              <h2>Equipo legal</h2>
              <span>{staff.length} miembro(s)</span>
            </div>
            <div className="legal-admin-grid">
              <form
                action={async (formData) => {
                  await inviteLegalUser(formData);
                }}
                className="legal-staff-form"
              >
                <label>
                  Nombre completo
                  <input name="full_name" placeholder="Nombre del analista o abogado" />
                </label>
                <label>
                  Correo
                  <input name="email" type="email" placeholder="persona@ofertalab.com" />
                </label>
                <label>
                  Equipo
                  <input name="team" defaultValue="Legal" />
                </label>
                <label>
                  Rol interno
                  <select name="role" defaultValue="member">
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <button className="primary" type="submit" disabled={savingStaff}>
                  {savingStaff ? "Enviando invitación..." : "Invitar al equipo"}
                </button>
              </form>

              <div className="legal-staff-list">
                {staff.length ? (
                  staff.map((member) => (
                    <article key={member.email} className="legal-staff-row">
                      <strong>{member.full_name}</strong>
                      <small>{member.email}</small>
                      <small>{member.team} · {member.role} · {member.active === "false" ? "inactivo" : "activo"}</small>
                    </article>
                  ))
                ) : (
                  <p>No hay miembros cargados todavía.</p>
                )}
              </div>
            </div>
          </section>
        </>
      ) : null}

      <section className="legal-workbench-grid">
        <div className="legal-list-card">
          <div className="legal-list-head">
            <div>
              <p className="legal-eyebrow">Pendientes</p>
              <h2>Casos por atender</h2>
            </div>
            <span>{loading ? "Cargando..." : `${filtered.length} caso(s)`}</span>
          </div>
          <details className="legal-bulk-panel">
            <summary>Actualizar varios casos</summary>
            <div className="legal-bulk-toolbar">
              <label className="legal-case-toggle-all">
                <input type="checkbox" checked={allFilteredSelected} onChange={() => toggleSelectFiltered()} />
                Seleccionar visibles
              </label>
              <select value={bulkAssignee} onChange={(event) => setBulkAssignee(event.target.value)} aria-label="Responsable para los casos seleccionados">
                <option value="">Sin cambio de responsable</option>
                {staffOptions.map((option) => (
                  <option key={option.email} value={option.full_name}>{option.full_name}</option>
                ))}
              </select>
              <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value)} aria-label="Estado para los casos seleccionados">
                <option value="">Sin cambio de estado</option>
                {FOLLOW_UP_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <input type="date" value={bulkTargetDate} onChange={(event) => setBulkTargetDate(event.target.value)} aria-label="Fecha objetivo para los casos seleccionados" />
              <button className="secondary" type="button" onClick={() => void bulkAssignCases()} disabled={savingBulk || !selectedCaseKeys.length}>
                {savingBulk ? "Actualizando..." : `Aplicar a ${selectedCaseKeys.length || 0}`}
              </button>
            </div>
            <div className="legal-bulk-note-grid">
              <select value={bulkNote} onChange={(event) => setBulkNote(event.target.value)}>
                <option value="">Plantilla de nota rápida</option>
                {BULK_NOTE_TEMPLATES.filter(Boolean).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <textarea value={bulkNote} onChange={(event) => setBulkNote(event.target.value)} rows={3} placeholder="Nota común para la tanda seleccionada" />
              <select value={bulkNextStep} onChange={(event) => setBulkNextStep(event.target.value)}>
                <option value="">Plantilla de siguiente paso</option>
                {BULK_NEXT_STEP_TEMPLATES.filter(Boolean).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
              <textarea value={bulkNextStep} onChange={(event) => setBulkNextStep(event.target.value)} rows={3} placeholder="Siguiente paso común para la tanda seleccionada" />
            </div>
          </details>
          <div className="legal-case-list">
            {filtered.map((entry) => (
              <div
                key={entry.case_key}
                className={`legal-case-row ${activeSelectedKey === entry.case_key ? "active" : ""}`}
              >
                <label className="legal-case-check">
                  <input
                    type="checkbox"
                    checked={selectedCaseKeys.includes(entry.case_key)}
                    onChange={() => toggleCaseSelection(entry.case_key)}
                    aria-label={`Seleccionar ${entry.company_name || "caso sin empresa"}`}
                  />
                  <span className="legal-sr-only">Seleccionar</span>
                </label>
                <button onClick={() => setSelectedKey(entry.case_key)} type="button" className="legal-case-button">
                  <span className="legal-case-tags">
                    <span className={`legal-sla-badge ${entry.sla_bucket}`}>{entry.urgency_label}</span>
                    <span className={`legal-tone ${entry.legal_tone}`}>{entry.legal_label}</span>
                  </span>
                  <strong>{entry.company_name || "Empresa sin nombre"}</strong>
                  <small>{entry.latest_opportunity_title || entry.latest_opportunity_id || "Sin contratación asociada"}</small>
                  <span className="legal-case-meta">
                    {entry.assigned_to ? `Asignado a ${entry.assigned_to}` : "Sin responsable"} · {entry.follow_up_status}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="legal-detail-card">
          {selected ? (
            <form
              key={selected.case_key}
              action={async (formData) => {
                await saveCase(formData);
              }}
              className="legal-detail-form"
            >
              <header className="legal-detail-header">
                <div>
                  <p className="legal-eyebrow">Caso seleccionado</p>
                  <h2>{selected.company_name || "Empresa sin nombre"}</h2>
                  <p>{selected.latest_institution || "Institución pendiente"} · {selected.latest_opportunity_id || "Código no disponible"}</p>
                </div>
                <div className="legal-detail-badges">
                  <span className={`legal-sla-badge ${selected.sla_bucket}`}>{selected.urgency_label}</span>
                  <span className={`legal-tone ${selected.legal_tone}`}>{selected.legal_label}</span>
                </div>
              </header>

              <section className="legal-next-action">
                <div>
                  <p className="legal-eyebrow">Siguiente acción</p>
                  <strong>{selected.next_step || "Defina el siguiente paso para este caso."}</strong>
                  <small>Última actualización: {formatDate(selected.updated_at || selected.latest_request_at)}</small>
                </div>
                <div>
                  <label>
                    Responsable
                    <select name="assigned_to" defaultValue={selected.assigned_to}>
                      <option value="">Sin responsable</option>
                      {assigneeOptions.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Estado
                    <select name="follow_up_status" defaultValue={selected.follow_up_status}>
                      {FOLLOW_UP_OPTIONS.map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Fecha objetivo
                    <input name="target_date" type="date" defaultValue={selected.target_date} />
                  </label>
                </div>
              </section>

              <div className="legal-case-detail-grid">
                <section className="legal-stacked-card">
                  <div className="legal-section-head">
                    <h3>Cliente</h3>
                    <span>{selected.status}</span>
                  </div>
                  <dl className="legal-facts">
                    <div><dt>Contacto</dt><dd>{selected.contact_name || "Sin contacto"}</dd></div>
                    <div><dt>Correo</dt><dd>{selected.contact_email || "Sin correo"}</dd></div>
                    <div><dt>Teléfono</dt><dd>{selected.contact_phone || "Sin teléfono"}</dd></div>
                    <div><dt>Provincia</dt><dd>{selected.company_province || "Sin provincia"}</dd></div>
                    <div><dt>Sitio web</dt><dd>{selected.company_website || "No registrado"}</dd></div>
                  </dl>
                </section>
                <section className="legal-stacked-card legal-procurement-card">
                  <div className="legal-section-head">
                    <h3>Contratación registrada</h3>
                    <span>{selected.request_count} solicitud(es)</span>
                  </div>
                  <dl className="legal-facts">
                    <div><dt>Institución</dt><dd>{selected.latest_institution || "Sin institución"}</dd></div>
                    <div><dt>Procedimiento</dt><dd>{selected.latest_opportunity_id || "Código no disponible"}</dd></div>
                    <div><dt>Contratación</dt><dd>{selected.latest_opportunity_title || "Sin título registrado"}</dd></div>
                    <div><dt>Servicio solicitado</dt><dd>{selected.latest_request_service || "Sin tipo"}</dd></div>
                    <div><dt>Estado en portal</dt><dd>{selected.latest_request_status || "Sin estado"}</dd></div>
                    <div><dt>Solicitud recibida</dt><dd>{formatDate(selected.latest_request_at)}</dd></div>
                  </dl>
                  <p className="legal-procurement-note">Los plazos, requisitos y documentos del expediente deben verificarse en SICOP antes de tomar una decisión legal.</p>
                </section>
              </div>

              <section className="legal-stacked-card">
                <h3>Perfil comercial</h3>
                <p>{selected.company_products || "Sin productos descritos."}</p>
                <p>{selected.company_summary || "Sin resumen comercial."}</p>
                <p>Experiencia: {selected.company_experience || "Sin detalle"}</p>
                <p>Capacidad: {selected.company_capacity || "Sin detalle"}</p>
              </section>

              <section className="legal-action-card">
                <div className="legal-section-head">
                  <h3>Seguimiento legal</h3>
                  <span>{selected.assigned_to ? `Responsable: ${selected.assigned_to}` : "Sin responsable"}</span>
                </div>
                <label>
                  Siguiente paso
                  <input name="next_step" defaultValue={selected.next_step} placeholder="Ejemplo: solicitar personería y validar requisitos del pliego" />
                </label>
                <label>
                  Nota interna
                  <textarea name="note" defaultValue={selected.note} rows={6} placeholder="Acuerdos, documentos recibidos o riesgos que debe conocer el equipo" />
                </label>
                <div className="legal-form-actions">
                  <button className="primary" type="submit" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar actualización"}
                  </button>
                  <span className="legal-save-hint">Se registra en el historial del caso.</span>
                </div>
              </section>

              <section className="legal-stacked-card">
                <div className="legal-section-head">
                  <h3>Historial del caso</h3>
                  <span>{selected.timeline?.length || 0} evento(s)</span>
                </div>
                <div className="legal-timeline">
                  {(selected.timeline || []).length ? (
                    selected.timeline.map((event) => (
                      <article key={event.id} className="legal-timeline-item">
                        <strong>{event.summary || "Actualización interna"}</strong>
                        <small>{event.actor_email || "Sistema"} · {formatDate(event.created_at)}</small>
                        {event.note ? <p>{event.note}</p> : null}
                      </article>
                    ))
                  ) : (
                    <p>Este caso todavía no tiene trazabilidad guardada.</p>
                  )}
                </div>
              </section>
            </form>
          ) : (
            <div className="legal-empty-state">
              <h2>Sin casos disponibles</h2>
              <p>Cuando entren perfiles y solicitudes del portal, esta bandeja los mostrará aquí.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}