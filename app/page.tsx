"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  describeProfileSector,
  rankOpportunities,
} from "./opportunity-matching";

type View = "inicio" | "registro" | "oportunidades" | "empresa";
type ServiceKey = "autogestion" | "asistida" | "integral";
type Profile = {
  name: string;
  contact: string;
  products: string;
  province: string;
  experience: string;
  capacity: string;
};
type Opportunity = {
  id: string;
  score: number;
  institution: string;
  title: string;
  closes: string;
  amount: string;
  fit: string;
  risk: string;
  tags: string[];
  keywords: string[];
};

const opportunities: Opportunity[] = [
  {
    id: "2026LD-000053-0058700001",
    score: 94,
    institution: "Consejo de Seguridad Vial",
    title: "Mantenimiento preventivo de sistemas de videovigilancia",
    closes: "Cierra en 5 días",
    amount: "₡18,4 millones estimados",
    fit: "Coincide con seguridad, cámaras y mantenimiento",
    risk: "Falta confirmar experiencia mínima",
    tags: ["Seguridad", "Mantenimiento", "Alta afinidad"],
    keywords: ["seguridad", "cámaras", "videovigilancia", "monitoreo"],
  },
  {
    id: "2026LE-000014-0001100001",
    score: 87,
    institution: "Universidad de Costa Rica",
    title: "Suministro e instalación de equipos de aire acondicionado",
    closes: "Cierra en 9 días",
    amount: "₡32,1 millones estimados",
    fit: "Coincide con instalación y climatización",
    risk: "Requiere visita técnica",
    tags: ["Climatización", "Instalación"],
    keywords: ["aire acondicionado", "climatización", "refrigeración", "hvac"],
  },
  {
    id: "2026LD-000089-0007300001",
    score: 79,
    institution: "Municipalidad de Heredia",
    title: "Servicio de monitoreo y respuesta de alarmas",
    closes: "Cierra en 12 días",
    amount: "Monto por confirmar",
    fit: "Coincide con monitoreo y respuesta",
    risk: "Garantía de participación por revisar",
    tags: ["Alarmas", "Servicio recurrente"],
    keywords: ["seguridad", "alarmas", "monitoreo", "vigilancia"],
  },
  {
    id: "DEMO-ALI-001",
    score: 93,
    institution: "Ministerio de Educación Pública",
    title: "Servicio de alimentación para centros educativos",
    closes: "Cierra en 6 días",
    amount: "₡24,8 millones estimados",
    fit: "Coincide con preparación y entrega de alimentos",
    risk: "Requiere permiso sanitario y menú nutricional",
    tags: ["Alimentación", "Entrega", "Alta afinidad"],
    keywords: ["comida", "alimentos", "comedor", "cocina", "catering"],
  },
  {
    id: "DEMO-ALI-002",
    score: 88,
    institution: "Caja Costarricense de Seguro Social",
    title: "Suministro periódico de frutas, verduras y abarrotes",
    closes: "Cierra en 10 días",
    amount: "₡15,6 millones estimados",
    fit: "Coincide con venta y distribución de alimentos",
    risk: "Debe confirmar cadena de frío y capacidad de entrega",
    tags: ["Víveres", "Distribución", "Alimentos"],
    keywords: ["alimentos", "víveres", "abarrotes", "frutas", "verduras"],
  },
  {
    id: "DEMO-ALI-003",
    score: 84,
    institution: "Universidad Nacional",
    title: "Servicio de catering para actividades institucionales",
    closes: "Cierra en 14 días",
    amount: "Monto según demanda",
    fit: "Coincide con catering y comida preparada",
    risk: "Requiere cotización por tipo de evento",
    tags: ["Catering", "Eventos", "Alimentación"],
    keywords: ["catering", "comida", "restaurante", "alimentación", "cocina"],
  },
];

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
  name: "",
  contact: "",
  products: "",
  province: "San José",
  experience: "Nunca he ofertado",
  capacity: "Hasta ₡10 millones",
};

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
              ¿Qué productos o servicios vende?
              <textarea
                required
                value={profile.products}
                onChange={(event) => update("products", event.target.value)}
                placeholder="Ej. cámaras, alarmas, monitoreo e instalación"
              />
              <small>Escriba con sus propias palabras. Nosotros lo organizamos.</small>
            </label>
          </>
        ) : (
          <>
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
}: {
  item: Opportunity;
  onOpen: (item: Opportunity) => void;
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
            <small>Encaje</small>
            <strong>{item.fit}</strong>
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
      </div>
      <button className="open-opportunity" onClick={() => onOpen(item)}>
        Decidir cómo ofertar <span>→</span>
      </button>
    </article>
  );
}

function Dashboard({
  profile,
  onService,
}: {
  profile: Profile;
  onService: (item: Opportunity) => void;
}) {
  const matches = rankOpportunities(profile.products, opportunities);
  const visibleOpportunities = matches.slice(0, 3);
  const sector = describeProfileSector(profile.products);
  const urgent = visibleOpportunities.filter((item) => {
    const days = Number(item.closes.match(/\d+/)?.[0] ?? 99);
    return days <= 7;
  }).length;

  return (
    <main className="dashboard">
      <section className="dashboard-heading">
        <div>
          <span className="eyebrow">Oportunidades para su empresa</span>
          <h1>
            Hola, {profile.contact || "Marco"}.
            <span>
              {visibleOpportunities.length
                ? " Encontramos opciones relacionadas con lo que vende."
                : " Todavía no encontramos una coincidencia segura."}
            </span>
          </h1>
          <p>
            Buscamos únicamente en <strong>{sector}</strong> y descartamos sectores
            ajenos a su perfil.
          </p>
        </div>
        <div className="profile-health">
          <div>
            <strong>72%</strong>
            <span>Perfil completo</span>
          </div>
          <button>Completar documentos</button>
        </div>
      </section>
      <section className="dashboard-stats">
        {[
          [
            "Recomendadas",
            String(visibleOpportunities.length),
            "Coincidencias verificables en esta demostración",
          ],
          [
            "Cierran esta semana",
            String(urgent),
            urgent ? "Conviene revisarlas primero" : "Sin urgencias detectadas",
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
            <small>Selección inteligente</small>
            <h2>Empiece por estas oportunidades</h2>
          </div>
          <button className="filter-button">Afinidad más alta⌄</button>
        </div>
        <div className="opportunity-list">
          {visibleOpportunities.length ? (
            visibleOpportunities.map((item) => (
              <OpportunityCard key={item.id} item={item} onOpen={onService} />
            ))
          ) : (
            <article className="opportunity-card">
              <div className="opportunity-main">
                <h3>No mostraremos oportunidades de sectores diferentes</h3>
                <p>
                  Amplíe la descripción de sus productos o servicios para buscar
                  sinónimos más precisos. Por ejemplo: “comida preparada, catering y
                  entrega de almuerzos”.
                </p>
              </div>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}

function Business({ profile }: { profile: Profile }) {
  return (
    <main className="business-page">
      <section className="business-header">
        <span className="eyebrow">Mi empresa</span>
        <h1>{profile.name || "Empresa de demostración"}</h1>
        <p>Este perfil determina qué oportunidades recomendamos y cuáles descartamos.</p>
      </section>
      <section className="business-grid">
        <div className="business-card primary-card">
          <small>Qué vende</small>
          <h2>{profile.products || "Seguridad, cámaras, alarmas y mantenimiento"}</h2>
          <button>Editar productos y servicios</button>
        </div>
        <div className="business-card">
          <small>Capacidad actual</small>
          <h3>{profile.capacity}</h3>
          <p>Provincia: {profile.province}</p>
        </div>
        <div className="business-card warning-card">
          <small>Documentos</small>
          <h3>3 de 8 registrados</h3>
          <p>Complete sus documentos para acelerar futuras ofertas.</p>
          <button>Revisar documentos</button>
        </div>
        <div className="business-card">
          <small>Experiencia</small>
          <h3>{profile.experience}</h3>
          <p>OfertaLab adaptará las explicaciones a su experiencia.</p>
        </div>
      </section>
    </main>
  );
}

function ServiceModal({
  opportunity,
  onClose,
}: {
  opportunity: Opportunity;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<ServiceKey | null>(null);
  const [requested, setRequested] = useState(false);
  return (
    <div className="modal-backdrop">
      <section className="service-modal" role="dialog" aria-modal="true">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        {requested ? (
          <div className="request-success">
            <span>✓</span>
            <small>Solicitud de demostración registrada</small>
            <h2>Ya sabemos cómo quiere participar.</h2>
            <p>
              En la versión operativa aquí verá precio, contrato, responsable y
              próximos pasos.
            </p>
            <button className="primary" onClick={onClose}>
              Volver a oportunidades
            </button>
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
                onClick={() => setRequested(true)}
              >
                Continuar
                <span>→</span>
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<View>("inicio");
  const [profile, setProfile] = useState<Profile>(blankProfile);
  const [hasProfile, setHasProfile] = useState(false);
  const [selected, setSelected] = useState<Opportunity | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("ofertalab-client-profile");
    if (!saved) return;
    try {
      setProfile(JSON.parse(saved));
      setHasProfile(true);
      setView("oportunidades");
    } catch {
      window.localStorage.removeItem("ofertalab-client-profile");
    }
  }, []);

  function saveProfile(next: Profile) {
    setProfile(next);
    setHasProfile(true);
    window.localStorage.setItem("ofertalab-client-profile", JSON.stringify(next));
    setView("oportunidades");
  }

  function demo() {
    if (!hasProfile)
      setProfile({
        name: "Seguridad Integral S.A.",
        contact: "Marco",
        products: "Cámaras, alarmas, monitoreo, instalación y mantenimiento",
        province: "San José",
        experience: "Nunca he ofertado",
        capacity: "De ₡10 a ₡50 millones",
      });
    setView("oportunidades");
  }

  return (
    <div className="app-shell">
      <Header view={view} setView={setView} hasProfile={hasProfile} />
      {view === "inicio" && (
        <Welcome onStart={() => setView("registro")} onDemo={demo} />
      )}
      {view === "registro" && <Registration initial={profile} onSave={saveProfile} />}
      {view === "oportunidades" && <Dashboard profile={profile} onService={setSelected} />}
      {view === "empresa" && <Business profile={profile} />}
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
        <button onClick={() => setView(hasProfile ? "empresa" : "registro")}>
          ○<span>Mi empresa</span>
        </button>
      </nav>
      {selected && <ServiceModal opportunity={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
