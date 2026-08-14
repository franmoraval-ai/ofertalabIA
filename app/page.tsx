"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CLIENT_PREPARATION_DAYS,
  describeProfileSector,
  daysUntilClosing,
  hasClientPreparationWindow,
  isClosingTodayOrLater,
  rankOpportunities,
} from "./opportunity-matching";

type View = "inicio" | "registro" | "oportunidades" | "empresa" | "solicitudes";
type ServiceKey = "autogestion" | "asistida" | "integral";
type RequestKind = ServiceKey | "seguimiento";
type Profile = {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  products: string;
  province: string;
  experience: string;
  capacity: string;
  website: string;
  summary: string;
};
type ServiceRequest = {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  institution: string;
  service: RequestKind;
  serviceTitle: string;
  status: string;
  createdAt: string;
};
type Opportunity = {
  id: string;
  score: number;
  institution: string;
  title: string;
  closes: string;
  openingDate: string;
  amount: string;
  fit: string;
  risk: string;
  tags: string[];
  keywords: string[];
  matchedTerms: string[];
  sourceUrl: string;
};

type PublicOpportunity = {
  procedure_no: string;
  cartel_no: string;
  title: string;
  institution: string;
  procedure_type: string;
  status: string;
  publication_date: string;
  opening_date: string;
  classification_code: string;
  source_url: string;
  public_visible?: boolean;
};

type OpportunityFeed = {
  generated_at: string;
  source_updated_at: string;
  count: number;
  opportunities: PublicOpportunity[];
};

type FeedStatus = "loading" | "ready" | "error";

function clientOpportunity(item: PublicOpportunity): Opportunity {
  const days = daysUntilClosing(item.opening_date);
  return {
    id: item.procedure_no || item.cartel_no,
    score: 70,
    institution: item.institution,
    title: item.title,
    closes: days === 0 ? "Cierra hoy" : `Cierra en ${days} día${days === 1 ? "" : "s"}`,
    openingDate: item.opening_date,
    amount: "Consultar monto en SICOP",
    fit: "Coincide con palabras de su actividad",
    risk: "Confirme requisitos, vigencia y documentos oficiales",
    tags: [item.procedure_type, item.status].filter(Boolean).slice(0, 2),
    keywords: [
      item.title,
      item.classification_code,
      item.procedure_type,
    ].filter(Boolean),
    matchedTerms: [],
    sourceUrl: item.source_url,
  };
}

const services: Record<
  ServiceKey,
  { label: string; title: string; description: string; includes: string[] }
> = {
  autogestion: {
    label: "Opción 1",
    title: "Quiero hacerlo yo",
    description:
      "OfertaLab IA le explica la contratación y le guía hasta tener el paquete listo.",
    includes: [
      "Recomendación de participar o no",
      "Competencia y precios observados",
      "Checklist y borradores",
      "Guía para presentar",
    ],
  },
  asistida: {
    label: "Opción 2",
    title: "Prepárenme la oferta",
    description:
      "Un especialista revisa el pliego y entrega una oferta lista para aprobar y firmar.",
    includes: [
      "Análisis completo de requisitos",
      "Preparación de documentos",
      "Estrategia de precio",
      "Entrega lista para firma",
    ],
  },
  integral: {
    label: "Opción 3",
    title: "Encárguense de todo",
    description:
      "OfertaLab acompaña el proceso completo desde la decisión hasta el resultado.",
    includes: [
      "Gestión integral del expediente",
      "Control de fechas y subsanaciones",
      "Seguimiento de aclaraciones",
      "Acompañamiento hasta adjudicación",
    ],
  },
};

const blankProfile: Profile = {
  id: "",
  name: "",
  contact: "",
  email: "",
  phone: "",
  products: "",
  province: "San José",
  experience: "Nunca he ofertado",
  capacity: "Hasta ₡10 millones",
  website: "",
  summary: "",
};

const REQUEST_STAGES = [
  "Solicitada",
  "En revisión del equipo",
  "Propuesta enviada",
  "Aprobada y firmada por usted",
] as const;

function normalizeProfile(value: Partial<Profile> | null | undefined): Profile {
  return {
    ...blankProfile,
    ...(value ?? {}),
  };
}

function ensureProfileId(profile: Profile): Profile {
  if (profile.id) return profile;
  return {
    ...profile,
    id: crypto.randomUUID(),
  };
}

function isProfileReady(profile: Profile) {
  return Boolean(
    profile.name.trim() &&
      profile.contact.trim() &&
      profile.email.trim() &&
      profile.products.trim(),
  );
}

function profileCompletion(profile: Profile) {
  const values = [
    profile.name,
    profile.contact,
    profile.email,
    profile.phone,
    profile.products,
    profile.province,
    profile.experience,
    profile.capacity,
    profile.website,
    profile.summary,
  ];
  const completed = values.filter((value) => value.trim()).length;
  return Math.round((completed / values.length) * 100);
}

function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">O</span>
      <span>
        <strong>OfertaLab</strong>
        <small>IA Clientes</small>
      </span>
    </span>
  );
}

function Header({
  view,
  setView,
  hasProfile,
}: {
  view: View;
  setView: (view: View) => void;
  hasProfile: boolean;
}) {
  return (
    <header className="topbar">
      <button className="brand-button" onClick={() => setView("inicio")}>
        <Brand />
      </button>
      <nav aria-label="Navegación principal">
        {[
          ["inicio", "Inicio"],
          ["oportunidades", "Oportunidades"],
          ["solicitudes", "Mis solicitudes"],
          ["empresa", "Mi empresa"],
        ].map(([target, label]) => (
          <button
            key={target}
            className={view === target ? "active" : ""}
            onClick={() =>
              setView(
                target === "inicio"
                  ? "inicio"
                  : hasProfile
                    ? (target as View)
                    : "registro",
              )
            }
          >
            {label}
          </button>
        ))}
      </nav>
      <button
        className="topbar-cta"
        onClick={() => setView(hasProfile ? "oportunidades" : "registro")}
      >
        {hasProfile ? "Ver oportunidades" : "Crear mi perfil"}
      </button>
    </header>
  );
}

function Welcome({ onStart, onDemo }: { onStart: () => void; onDemo: () => void }) {
  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Compras públicas, por fin en lenguaje claro</span>
          <h1>
            Su empresa también puede <span>venderle al Estado.</span>
          </h1>
          <p>
            Encontramos oportunidades adecuadas, le decimos si puede cumplir y le
            acompañamos para presentar una oferta profesional, aunque nunca haya
            usado SICOP.
          </p>
          <div className="hero-actions">
            <button className="primary" onClick={onStart}>
              Quiero empezar a ofertar <span>→</span>
            </button>
            <button className="secondary" onClick={onDemo}>
              Ver cómo funciona
            </button>
          </div>
          <div className="trust-row">
            <span>✓ Datos públicos de SICOP</span>
            <span>✓ Requisitos explicados</span>
            <span>✓ Acompañamiento humano</span>
          </div>
        </div>

        <div className="hero-card" aria-label="Ejemplo de oportunidad recomendada">
          <div className="hero-card-top">
            <span className="match-badge">94% compatible</span>
            <span className="closing">Cierra en 5 días</span>
          </div>
          <p className="institution">Consejo de Seguridad Vial</p>
          <h2>Mantenimiento de sistemas de videovigilancia</h2>
          <div className="opportunity-facts">
            <div>
              <small>Por qué le sirve</small>
              <strong>Coincide con seguridad y cámaras</strong>
            </div>
            <div>
              <small>Valor estimado</small>
              <strong>₡18,4 millones</strong>
            </div>
          </div>
          <div className="recommendation">
            <span className="pulse" />
            <div>
              <small>Recomendación OfertaLab IA</small>
              <strong>Sí conviene analizarla</strong>
            </div>
          </div>
          <button className="card-action" onClick={onDemo}>
            Ver análisis sencillo <span>→</span>
          </button>
        </div>
      </section>

      <section className="promise">
        {[
          [
            "01",
            "Díganos qué vende",
            "Un perfil sencillo nos ayuda a separar oportunidades reales del ruido.",
          ],
          [
            "02",
            "Decida con claridad",
            "Le mostramos requisitos, riesgos, competencia y próximos pasos.",
          ],
          [
            "03",
            "Elija cómo participar",
            "Hágalo con nuestra guía o deje que el equipo prepare el proceso.",
          ],
        ].map(([number, title, copy]) => (
          <div key={number}>
            <span className="section-number">{number}</span>
            <h3>{title}</h3>
            <p>{copy}</p>
          </div>
        ))}
      </section>

      <section className="honest">
        <span className="honest-mark">✦</span>
        <div>
          <small>Nuestra diferencia</small>
          <h2>No le enviamos cientos de concursos. Le ayudamos a competir en los correctos.</h2>
        </div>
        <p>
          Sin promesas vacías: también le diremos cuándo una contratación no le
          conviene.
        </p>
      </section>
    </main>
  );
}

function Registration({
  initial,
  onSave,
}: {
  initial: Profile;
  onSave: (profile: Profile) => void;
}) {
  const [profile, setProfile] = useState(initial);
  const [step, setStep] = useState(1);
  const update = (field: keyof Profile, value: string) =>
    setProfile((current) => ({ ...current, [field]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (step === 1) return setStep(2);
    onSave(profile);
  }

  return (
    <main className="onboarding">
      <section className="onboarding-intro">
        <span className="eyebrow">Su punto de partida</span>
        <h1>Conozcamos su empresa.</h1>
        <p>
          No necesita saber de contratación pública. Cuéntenos qué hace y
          nosotros lo traducimos en oportunidades.
        </p>
        <div className="privacy-note">
          <span>⌁</span>
          <p>Nunca le pediremos contraseñas, PIN ni certificados de firma digital.</p>
        </div>
      </section>

      <form className="profile-form" onSubmit={submit}>
        <div className="form-progress">
          <span>Paso {step} de 2</span>
          <div>
            <i className="complete" />
            <i className={step === 2 ? "complete" : ""} />
          </div>
        </div>
        <div className="form-heading">
          <small>{step === 1 ? "Información básica" : "Capacidad y experiencia"}</small>
          <h2>
            {step === 1
              ? "¿Quién participará en las ofertas?"
              : "Busquemos oportunidades que sí pueda atender."}
          </h2>
        </div>
        {step === 1 ? (
          <>
            <label>
              Nombre de la empresa
              <input
                required
                value={profile.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Ej. Seguridad Integral S.A."
              />
            </label>
            <label>
              Nombre de contacto
              <input
                required
                value={profile.contact}
                onChange={(event) => update("contact", event.target.value)}
                placeholder="¿Cómo le llamamos?"
              />
            </label>
            <label>
              Correo electrónico
              <input
                required
                type="email"
                value={profile.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="nombre@empresa.com"
              />
            </label>
            <label>
              Teléfono o WhatsApp
              <input
                value={profile.phone}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="Ej. +506 8888 7777"
              />
            </label>
            <label>
              Sitio web o red principal
              <input
                value={profile.website}
                onChange={(event) => update("website", event.target.value)}
                placeholder="https://suempresa.com"
              />
            </label>
          </>
        ) : (
          <>
            <label>
              ¿Qué productos o servicios vende?
              <textarea
                required
                value={profile.products}
                onChange={(event) => update("products", event.target.value)}
                placeholder="Ej. cámaras, alarmas, monitoreo e instalación"
              />
              <small>Indique de 2 a 4 productos o servicios concretos. Evite solo categorías generales como “seguridad” o “tecnología”.</small>
            </label>
            <label>
              Provincia principal
              <select
                value={profile.province}
                onChange={(event) => update("province", event.target.value)}
              >
                {[
                  "San José",
                  "Alajuela",
                  "Cartago",
                  "Heredia",
                  "Guanacaste",
                  "Puntarenas",
                  "Limón",
                  "Todo el país",
                ].map((province) => (
                  <option key={province}>{province}</option>
                ))}
              </select>
            </label>
            <label>
              Experiencia en compras públicas
              <select
                value={profile.experience}
                onChange={(event) => update("experience", event.target.value)}
              >
                <option>Nunca he ofertado</option>
                <option>He intentado una o dos veces</option>
                <option>Ya vendo al Estado</option>
              </select>
            </label>
            <label>
              Tamaño de contratación que puede atender
              <select
                value={profile.capacity}
                onChange={(event) => update("capacity", event.target.value)}
              >
                <option>Hasta ₡10 millones</option>
                <option>De ₡10 a ₡50 millones</option>
                <option>De ₡50 a ₡250 millones</option>
                <option>Más de ₡250 millones</option>
              </select>
            </label>
            <label>
              Cuéntenos más sobre su empresa
              <textarea
                value={profile.summary}
                onChange={(event) => update("summary", event.target.value)}
                placeholder="Ej. Tenemos cobertura nacional, cuadrillas propias o experiencia con instituciones públicas."
              />
              <small>
                Este resumen ayuda al equipo a entender mejor a quién estamos atendiendo.
              </small>
            </label>
          </>
        )}
        <div className="form-actions">
          {step === 2 && (
            <button type="button" className="secondary" onClick={() => setStep(1)}>
              Atrás
            </button>
          )}
          <button type="submit" className="primary">
            {step === 1 ? "Continuar" : "Encontrar mis oportunidades"} <span>→</span>
          </button>
        </div>
      </form>
    </main>
  );
}

function OpportunityCard({
  item,
  onOpen,
  onFollow,
  followed,
}: {
  item: Opportunity;
  onOpen: (item: Opportunity) => void;
  onFollow: (item: Opportunity) => void;
  followed: boolean;
}) {
  return (
    <article className="opportunity-card">
      <div className="score-ring">
        <strong>{item.score}</strong>
        <small>/100</small>
      </div>
      <div className="opportunity-main">
        <div className="opportunity-meta">
          <span>{item.institution}</span>
          <span className="closing">{item.closes}</span>
        </div>
        <h3>{item.title}</h3>
        <p className="procedure">{item.id}</p>
        <div className="tag-list">
          {item.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
        <div className="opportunity-summary">
          <p>
            <small>Por qué coincide</small>
            <strong>
              {item.matchedTerms.length
                ? `Coincide con: ${item.matchedTerms.slice(0, 4).join(", ")}`
                : item.fit}
            </strong>
          </p>
          <p>
            <small>Atención</small>
            <strong>{item.risk}</strong>
          </p>
          <p>
            <small>Monto</small>
            <strong>{item.amount}</strong>
          </p>
        </div>
        {item.matchedTerms.length > 0 && (
          <div className="match-terms" aria-label="Palabras de su perfil que coinciden">
            {item.matchedTerms.slice(0, 6).map((term) => (
              <span key={term}>{term}</span>
            ))}
          </div>
        )}
      </div>
      <div className="opportunity-actions">
        {item.sourceUrl && (
          <a href={item.sourceUrl} target="_blank" rel="noreferrer">
            Ver ficha en SICOP <span>↗</span>
          </a>
        )}
        <button className="open-opportunity" onClick={() => onOpen(item)}>
          Decidir cómo ofertar <span>→</span>
        </button>
        <button
          className="secondary"
          onClick={() => onFollow(item)}
          disabled={followed}
        >
          {followed ? "En seguimiento ✓" : "Seguir para analizar"}
        </button>
      </div>
    </article>
  );
}

function Dashboard({
  profile,
  onService,
  onOpenProfile,
  opportunities,
  feedStatus,
  generatedAt,
  requests,
  onFollow,
}: {
  profile: Profile;
  onService: (item: Opportunity) => void;
  onOpenProfile: () => void;
  opportunities: Opportunity[];
  feedStatus: FeedStatus;
  generatedAt: string;
  requests: ServiceRequest[];
  onFollow: (item: Opportunity) => void;
}) {
  const matches = rankOpportunities(profile.products, opportunities);
  const activeMatches = matches.filter((item) =>
    isClosingTodayOrLater(item.openingDate),
  );
  const preparedMatches = activeMatches.filter((item) =>
    hasClientPreparationWindow(item.openingDate),
  );
  const visibleOpportunities = preparedMatches.slice(0, 12);
  const urgentMatches = activeMatches
    .filter((item) => !hasClientPreparationWindow(item.openingDate))
    .slice(0, 6);
  const followedIds = new Set(
    requests
      .filter((request) => request.service === "seguimiento")
      .map((request) => request.opportunityId),
  );
  const sector = describeProfileSector(profile.products);
  const completion = profileCompletion(profile);
  const updatedLabel = generatedAt
    ? new Intl.DateTimeFormat("es-CR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(generatedAt))
    : "";

  return (
    <main className="dashboard">
      <section className="dashboard-heading">
        <div>
          <span className="eyebrow">Oportunidades para su empresa</span>
          <h1>
            Hola, {profile.contact || "Marco"}.
            <span>
              {visibleOpportunities.length
                ? " Encontramos opciones relacionadas con lo que vende y tiempo para prepararlas."
                : " Estamos buscando una oportunidad que pueda preparar con calma."}
            </span>
          </h1>
          <p>
            Buscamos únicamente en <strong>{sector}</strong> y descartamos sectores
            ajenos a su perfil.
          </p>
        </div>
        <div className="profile-health">
          <div>
            <strong>{completion}%</strong>
            <span>Perfil completo</span>
          </div>
          <button onClick={onOpenProfile}>Ver o completar perfil</button>
        </div>
      </section>
      <section className="dashboard-stats">
        {[
          [
            "Recomendadas",
            feedStatus === "loading" ? "…" : String(preparedMatches.length),
            `Coincidencias con al menos ${CLIENT_PREPARATION_DAYS} días para prepararse`,
          ],
          [
            "Plazo mínimo",
            `${CLIENT_PREPARATION_DAYS} días`,
            "Priorizamos ofertas con tiempo real para participar",
          ],
          [
            "Cierre próximo",
            String(urgentMatches.length),
            "También puede seguirlas y analizarlas si ya está preparado",
          ],
          ["Sector detectado", sector, `Según: ${profile.products}`],
        ].map(([label, value, detail]) => (
          <div key={label}>
            <small>{label}</small>
            <strong>{value}</strong>
            <span>{detail}</span>
          </div>
        ))}
      </section>
      <section>
        <div className="section-heading">
          <div>
            <small>Selección inteligente sobre datos públicos reales</small>
            <h2>
              {matches.length
                ? `Las ${Math.min(preparedMatches.length, 12)} mejores coincidencias con tiempo para prepararse`
                : "Resultado de la búsqueda"}
            </h2>
          </div>
          <span className="feed-updated">
            {updatedLabel ? `Datos exportados: ${updatedLabel}` : "Consultando datos…"}
          </span>
        </div>
        <div className="opportunity-list">
          {feedStatus === "loading" ? (
            <article className="opportunity-card status-card">
              <div className="opportunity-main">
                <h3>Cargando oportunidades reales…</h3>
                <p>Estamos leyendo la selección pública almacenada por OfertaLab IA.</p>
              </div>
            </article>
          ) : feedStatus === "error" ? (
            <article className="opportunity-card status-card">
              <div className="opportunity-main">
                <h3>No pudimos cargar los datos públicos</h3>
                <p>Actualice la página. Su perfil permanece guardado en este dispositivo.</p>
              </div>
            </article>
          ) : visibleOpportunities.length ? (
            visibleOpportunities.map((item) => (
              <OpportunityCard
                key={item.id}
                item={item}
                onOpen={onService}
                onFollow={onFollow}
                followed={followedIds.has(item.id)}
              />
            ))
          ) : (
            <article className="opportunity-card">
              <div className="opportunity-main">
                <h3>
                  {matches.length
                    ? "Aún no hay una coincidencia con tiempo suficiente"
                    : "No mostraremos oportunidades de sectores diferentes"}
                </h3>
                <p>
                  {matches.length
                    ? `Las coincidencias actuales cierran antes de ${CLIENT_PREPARATION_DAYS} días. Volveremos a priorizar opciones con más tiempo para que pueda preparar una oferta sólida.`
                    : "Amplíe la descripción de sus productos o servicios para buscar sinónimos más precisos. No rellenaremos el resultado con sectores diferentes."}
                </p>
              </div>
            </article>
          )}
        </div>
      </section>
      {feedStatus === "ready" && urgentMatches.length > 0 && (
        <section>
          <div className="section-heading">
            <div>
              <small>Opciones con cierre próximo</small>
              <h2>También puede revisar estas oportunidades urgentes</h2>
            </div>
            <span className="feed-updated">
              Úselas si ya cuenta con documentos y capacidad para responder pronto.
            </span>
          </div>
          <div className="opportunity-list">
            {urgentMatches.map((item) => (
              <OpportunityCard
                key={item.id}
                item={item}
                onOpen={onService}
                onFollow={onFollow}
                followed={followedIds.has(item.id)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function Business({
  profile,
  onEdit,
  onDelete,
}: {
  profile: Profile;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const completion = profileCompletion(profile);

  return (
    <main className="business-page">
      <section className="business-header">
        <span className="eyebrow">Mi empresa</span>
        <h1>{profile.name || "Empresa de demostración"}</h1>
        <p>Este perfil determina qué oportunidades recomendamos y cuáles descartamos.</p>
        <div className="business-actions">
          <button className="primary" onClick={onEdit}>
            Editar perfil
          </button>
          <button className="secondary danger-button" onClick={onDelete}>
            Eliminar perfil de este dispositivo
          </button>
        </div>
      </section>
      <section className="business-grid">
        <div className="business-card primary-card">
          <small>Qué vende</small>
          <h2>{profile.products || "Seguridad, cámaras, alarmas y mantenimiento"}</h2>
          <p>
            {profile.summary || "Agregue un resumen corto para darle más contexto al equipo."}
          </p>
        </div>
        <div className="business-card">
          <small>Contacto principal</small>
          <h3>{profile.contact || "Sin nombre de contacto"}</h3>
          <p>{profile.email || "Agregue un correo electrónico"}</p>
          <p>{profile.phone || "Agregue teléfono o WhatsApp"}</p>
        </div>
        <div className="business-card warning-card">
          <small>Perfil listo para atención</small>
          <h3>{completion}% completo</h3>
          <p>Mientras más completo esté, mejor podremos ubicar y atender a su empresa.</p>
        </div>
        <div className="business-card">
          <small>Capacidad y contexto</small>
          <h3>{profile.capacity}</h3>
          <p>Provincia: {profile.province}</p>
          <p>{profile.experience}</p>
          <p>{profile.website || "Sin sitio web registrado"}</p>
        </div>
      </section>
    </main>
  );
}

function ServiceModal({
  opportunity,
  onClose,
  onRequest,
  onGoToRequests,
}: {
  opportunity: Opportunity;
  onClose: () => void;
  onRequest: (opportunity: Opportunity, service: ServiceKey) => void;
  onGoToRequests: () => void;
}) {
  const [selected, setSelected] = useState<ServiceKey | null>(null);
  const [requested, setRequested] = useState(false);

  function confirm() {
    if (!selected) return;
    onRequest(opportunity, selected);
    setRequested(true);
  }

  return (
    <div className="modal-backdrop">
      <section className="service-modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        {requested ? (
          <div className="request-success">
            <span>✓</span>
            <small>Solicitud registrada</small>
            <h2>Ya sabemos cómo quiere participar.</h2>
            <p>
              Guardamos su solicitud en este dispositivo. El equipo de OfertaLab IA
              revisará la contratación y le enviará una propuesta. Usted siempre
              acuerda el precio, aprueba y firma; el prototipo no procesa pagos.
            </p>
            <div className="request-success-actions">
              <button className="primary" onClick={onGoToRequests}>
                Ver seguimiento
              </button>
              <button className="secondary" onClick={onClose}>
                Volver a oportunidades
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="modal-heading">
              <span className="eyebrow">Elija el nivel de acompañamiento</span>
              <h2>¿Cómo quiere participar?</h2>
              <p>
                {opportunity.title} · <strong>{opportunity.institution}</strong>
              </p>
            </div>
            <div className="service-grid">
              {(Object.entries(services) as [ServiceKey, (typeof services)[ServiceKey]][]).map(
                ([key, service]) => (
                  <button
                    key={key}
                    className={`service-option ${selected === key ? "selected" : ""}`}
                    onClick={() => setSelected(key)}
                  >
                    <span className="service-number">{service.label}</span>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <ul>
                      {service.includes.map((item) => (
                        <li key={item}>✓ {item}</li>
                      ))}
                    </ul>
                    <strong>
                      {selected === key ? "Opción elegida ✓" : "Elegir esta opción"}
                    </strong>
                  </button>
                ),
              )}
            </div>
            <div className="modal-footer">
              <p>El cliente siempre revisa y aprueba precios, declaraciones y firma.</p>
              <button
                className="primary"
                disabled={!selected}
                onClick={confirm}
              >
                Solicitar este servicio
                <span>→</span>
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function Requests({
  requests,
  onExplore,
  onCancel,
}: {
  requests: ServiceRequest[];
  onExplore: () => void;
  onCancel: (id: string) => void;
}) {
  return (
    <main className="requests-page">
      <section className="requests-header">
        <span className="eyebrow">Mis seguimientos y solicitudes</span>
        <h1>Oportunidades que está revisando</h1>
        <p>
          Aquí verá el estado de cada acompañamiento que solicitó. El equipo acuerda
          el precio con usted; siempre aprueba y firma. Este prototipo no procesa
          pagos ni credenciales de SICOP.
        </p>
      </section>
      {requests.length ? (
        <section className="requests-list">
          {requests.map((request) => {
            const currentStep = REQUEST_STAGES.indexOf(
              request.status as (typeof REQUEST_STAGES)[number],
            );
            return (
              <article key={request.id} className="request-card">
                <div className="request-card-head">
                  <div>
                    <span className="request-service">{request.serviceTitle}</span>
                    <h3>{request.opportunityTitle}</h3>
                    <p className="request-institution">{request.institution}</p>
                  </div>
                  <span className="request-status">{request.status}</span>
                </div>
                {request.service === "seguimiento" ? (
                  <p>
                    La guardó para analizarla. Revise la ficha oficial y, cuando esté
                    listo, elija cómo quiere ofertar.
                  </p>
                ) : (
                  <ol className="request-timeline" aria-label="Etapas del servicio">
                    {REQUEST_STAGES.map((stage, index) => (
                      <li
                        key={stage}
                        className={index <= currentStep ? "done" : ""}
                      >
                        <span className="dot" />
                        {stage}
                      </li>
                    ))}
                  </ol>
                )}
                <div className="request-card-footer">
                  <small>
                    Solicitada:{" "}
                    {new Intl.DateTimeFormat("es-CR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(request.createdAt))}
                  </small>
                  <button
                    className="request-cancel"
                    onClick={() => onCancel(request.id)}
                  >
                    Cancelar solicitud
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="requests-empty">
          <h2>Todavía no ha solicitado ningún servicio.</h2>
          <p>
            Cuando elija Autogestión, Oferta asistida o Gestión integral en una
            oportunidad, aparecerá aquí para darle seguimiento.
          </p>
          <button className="primary" onClick={onExplore}>
            Ver oportunidades
          </button>
        </section>
      )}
    </main>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("inicio");
  const [profile, setProfile] = useState<Profile>(blankProfile);
  const [hasProfile, setHasProfile] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [feedStatus, setFeedStatus] = useState<FeedStatus>("loading");
  const [generatedAt, setGeneratedAt] = useState("");
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const searchParams = new URLSearchParams(window.location.search);
    if (hashParams.get("type") === "recovery" || searchParams.get("type") === "recovery") {
      window.location.replace(
        `/legal/reset-password${window.location.search}${window.location.hash}`,
      );
    }
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("ofertalab-client-profile");
    if (!saved) return;
    try {
      const loaded = normalizeProfile(JSON.parse(saved));
      setProfile(loaded);
      setHasProfile(isProfileReady(loaded));
      setView(isProfileReady(loaded) ? "oportunidades" : "registro");
    } catch {
      window.localStorage.removeItem("ofertalab-client-profile");
    }
  }, []);

  useEffect(() => {
    const saved = window.localStorage.getItem("ofertalab-client-requests");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) setRequests(parsed);
    } catch {
      window.localStorage.removeItem("ofertalab-client-requests");
    }
  }, []);

  useEffect(() => {
    let active = true;
    const loadFeed = async () => {
      for (const source of ["/api/opportunities", "/data/opportunities.json"]) {
        const response = await fetch(source, { cache: "no-store" });
        if (!response.ok) continue;
        const feed = (await response.json()) as OpportunityFeed;
        if (Array.isArray(feed.opportunities) && feed.opportunities.length) {
          return feed;
        }
      }
      throw new Error("No hay una fuente de oportunidades disponible.");
    };
    loadFeed()
      .then((feed) => {
        if (!active || !Array.isArray(feed.opportunities)) return;
        setOpportunities(
          feed.opportunities
            .filter((item) => item.public_visible !== false)
            .map(clientOpportunity),
        );
        setGeneratedAt(feed.generated_at);
        setFeedStatus("ready");
      })
      .catch(() => {
        if (active) setFeedStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  function saveProfile(next: Profile) {
    const normalized = ensureProfileId(normalizeProfile(next));
    setProfile(normalized);
    setHasProfile(isProfileReady(normalized));
    window.localStorage.setItem("ofertalab-client-profile", JSON.stringify(normalized));
    void fetch("/api/profiles", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id: normalized.id,
        company_name: normalized.name,
        contact_name: normalized.contact,
        contact_email: normalized.email,
        contact_phone: normalized.phone,
        company_website: normalized.website,
        company_province: normalized.province,
        company_experience: normalized.experience,
        company_capacity: normalized.capacity,
        company_products: normalized.products,
        company_summary: normalized.summary,
      }),
    }).catch(() => {
      /* El perfil sigue guardado localmente aunque el envío falle. */
    });
    setView("oportunidades");
  }

  function editProfile() {
    setView("registro");
  }

  function deleteProfile() {
    const profileId = profile.id;
    if (!window.confirm("Se eliminará el perfil guardado en este dispositivo.")) {
      return;
    }
    window.localStorage.removeItem("ofertalab-client-profile");
    window.localStorage.removeItem("ofertalab-client-requests");
    setProfile(blankProfile);
    setRequests([]);
    setSelected(null);
    setHasProfile(false);
    setView("inicio");
    if (!profileId) return;
    void fetch("/api/profiles", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: profileId }),
    }).catch(() => {
      /* El perfil local ya fue eliminado aunque el servidor no responda. */
    });
  }

  function persistRequests(next: ServiceRequest[]) {
    setRequests(next);
    window.localStorage.setItem(
      "ofertalab-client-requests",
      JSON.stringify(next),
    );
  }

  function requestService(opportunity: Opportunity, service: ServiceKey) {
    const id = `${opportunity.id}::${service}`;
    const entry: ServiceRequest = {
      id,
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      institution: opportunity.institution,
      service,
      serviceTitle: services[service].title,
      status: REQUEST_STAGES[0],
      createdAt: new Date().toISOString(),
    };
    persistRequests([entry, ...requests.filter((item) => item.id !== id)]);
    void fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        opportunity_id: opportunity.id,
        opportunity_title: opportunity.title,
        institution: opportunity.institution,
        service,
        company_name: profile.name,
        contact_name: profile.contact || profile.name,
        contact_email: profile.email,
        contact_phone: profile.phone,
        company_website: profile.website,
        company_province: profile.province,
        company_experience: profile.experience,
        company_capacity: profile.capacity,
        company_products: profile.products,
        company_summary: profile.summary,
      }),
    }).catch(() => {
      /* La solicitud queda guardada localmente aunque el envío falle. */
    });
  }

  function followOpportunity(opportunity: Opportunity) {
    const id = `${opportunity.id}::seguimiento`;
    const entry: ServiceRequest = {
      id,
      opportunityId: opportunity.id,
      opportunityTitle: opportunity.title,
      institution: opportunity.institution,
      service: "seguimiento",
      serviceTitle: "Quiero analizarla primero",
      status: "En seguimiento",
      createdAt: new Date().toISOString(),
    };
    persistRequests([entry, ...requests.filter((item) => item.id !== id)]);
    void fetch("/api/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        opportunity_id: opportunity.id,
        opportunity_title: opportunity.title,
        institution: opportunity.institution,
        service: "seguimiento",
        company_name: profile.name,
        contact_name: profile.contact || profile.name,
        contact_email: profile.email,
        contact_phone: profile.phone,
        company_website: profile.website,
        company_province: profile.province,
        company_experience: profile.experience,
        company_capacity: profile.capacity,
        company_products: profile.products,
        company_summary: profile.summary,
      }),
    }).catch(() => {
      /* El seguimiento queda guardado localmente aunque el servidor no responda. */
    });
  }

  function cancelRequest(id: string) {
    persistRequests(requests.filter((item) => item.id !== id));
  }

  function demo() {
    if (!hasProfile) {
      const sample = ensureProfileId({
        id: "",
        name: "Seguridad Integral S.A.",
        contact: "Marco",
        email: "marco@seguridadintegral.cr",
        phone: "+506 8888 7777",
        products: "Cámaras, alarmas, monitoreo, instalación y mantenimiento",
        province: "San José",
        experience: "Nunca he ofertado",
        capacity: "De ₡10 a ₡50 millones",
        website: "https://seguridadintegral.cr",
        summary:
          "Empresa con instalación y monitoreo para clientes institucionales en la GAM.",
      });
      setProfile(sample);
      setHasProfile(true);
    }
    setView("oportunidades");
  }

  return (
    <div className="app-shell">
      <Header view={view} setView={setView} hasProfile={hasProfile} />
      {view === "inicio" && (
        <Welcome onStart={() => setView("registro")} onDemo={demo} />
      )}
      {view === "registro" && <Registration initial={profile} onSave={saveProfile} />}
      {view === "oportunidades" && (
        <Dashboard
          profile={profile}
          onService={setSelected}
          onOpenProfile={() => setView("empresa")}
            opportunities={opportunities}
            feedStatus={feedStatus}
            generatedAt={generatedAt}
            requests={requests}
            onFollow={followOpportunity}
        />
      )}
      {view === "empresa" && (
        <Business profile={profile} onEdit={editProfile} onDelete={deleteProfile} />
      )}
      {view === "solicitudes" && (
        <Requests
          requests={requests}
          onExplore={() => setView(hasProfile ? "oportunidades" : "registro")}
          onCancel={cancelRequest}
        />
      )}
      <footer>
        <Brand />
        <p>
          OfertaLab IA simplifica la contratación pública para que más empresas
          puedan competir profesionalmente.
        </p>
        <span>Prototipo · No solicita credenciales de SICOP</span>
      </footer>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        <button onClick={() => setView("inicio")}>⌂<span>Inicio</span></button>
        <button onClick={() => setView(hasProfile ? "oportunidades" : "registro")}>
          ◇<span>Oportunidades</span>
        </button>
        <button onClick={() => setView(hasProfile ? "solicitudes" : "registro")}>
          ▤<span>Solicitudes</span>
        </button>
        <button onClick={() => setView(hasProfile ? "empresa" : "registro")}>
          ○<span>Mi empresa</span>
        </button>
      </nav>
      {selected && (
        <ServiceModal
          opportunity={selected}
          onClose={() => setSelected(null)}
          onRequest={requestService}
          onGoToRequests={() => {
            setSelected(null);
            setView("solicitudes");
          }}
        />
      )}
    </div>
  );
}
