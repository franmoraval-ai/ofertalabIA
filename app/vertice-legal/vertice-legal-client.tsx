"use client";

import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  FileSearch,
  Landmark,
  MessageCircle,
  Send,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";

type FormStatus = "idle" | "sending" | "sent" | "error";

const procedures = [
  {
    title: "Revisión de requisitos",
    detail: "Ordenamos documentos, plazos y obligaciones antes de que el trámite avance.",
    icon: FileSearch,
  },
  {
    title: "Gestión documental",
    detail: "Preparamos la ruta de evidencia para que cada entrega tenga respaldo y responsable.",
    icon: ClipboardCheck,
  },
  {
    title: "Seguimiento de expediente",
    detail: "Acompañamos aclaraciones, cambios y próximos pasos con trazabilidad.",
    icon: Landmark,
  },
];

const steps = [
  ["01", "Cuéntenos el caso", "Recibimos el trámite y validamos la información mínima para iniciar."],
  ["02", "Definimos la ruta", "Identificamos documentos, responsable, riesgo y fecha de cada acción."],
  ["03", "Damos seguimiento", "Usted recibe un siguiente paso claro sin perder el control de decisiones y firmas."],
];

function procedureKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "consulta";
}

export function VerticeLegalClient() {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const procedure = String(values.get("procedure") || "Consulta legal").trim();
    const company = String(values.get("company") || "").trim();
    const contact = String(values.get("contact") || "").trim();
    const email = String(values.get("email") || "").trim();
    const phone = String(values.get("phone") || "").trim();
    const detail = String(values.get("detail") || "").trim();

    setStatus("sending");
    setMessage("");
    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunity_id: `vertice-legal:${procedureKey(procedure)}:${email.toLowerCase()}`,
          opportunity_title: `Gestión Vértice Legal: ${procedure}`,
          institution: "Vértice Legal",
          service: "integral",
          company_name: company,
          contact_name: contact,
          contact_email: email,
          contact_phone: phone,
          company_website: "",
          company_province: "Costa Rica",
          company_experience: "Consulta de trámite",
          company_capacity: "Por definir",
          company_products: procedure,
          company_summary: detail,
        }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "No pudimos registrar el trámite.");
      }
      setStatus("sent");
      form.reset();
    } catch (caughtError) {
      setStatus("error");
      setMessage(caughtError instanceof Error ? caughtError.message : "No pudimos registrar el trámite.");
    }
  }

  return (
    <main className="vertice-page">
      <header className="vertice-nav">
        <a className="vertice-brand" href="#inicio" aria-label="Vértice Legal, inicio">
          <span className="vertice-logo-image" style={{ position: "relative", display: "block", overflow: "hidden" }}><Image src="/vertice-legal-logo.png" alt="Vértice Legal" fill priority sizes="(max-width: 760px) 175px, 230px" /></span>
        </a>
        <nav aria-label="Navegación Vértice Legal">
          <a href="#servicios">Servicios</a>
          <a href="#proceso">Proceso</a>
          <a href="#consulta">Consulta</a>
        </nav>
        <a className="vertice-nav-action" href="#consulta">Iniciar trámite <ArrowRight size={16} /></a>
      </header>

      <section className="vertice-hero" id="inicio">
        <div className="vertice-hero-image" role="img" aria-label="Documentos legales sobre una mesa de trabajo" />
        <div className="vertice-hero-shade" />
        <div className="vertice-container vertice-hero-content">
          <p className="vertice-kicker"><span /> Gestión legal para empresas</p>
          <h1>Sus trámites merecen una <em>ruta clara.</em></h1>
          <p className="vertice-hero-lede">
            Vértice Legal organiza requisitos, documentos y seguimiento para que su empresa avance con criterio y sin perder el control.
          </p>
          <div className="vertice-hero-actions">
            <a className="vertice-button vertice-button-light" href="#consulta">Evaluar mi trámite <ArrowRight size={18} /></a>
            <a className="vertice-quiet-link" href="#proceso">Conocer el proceso</a>
          </div>
        </div>
        <div className="vertice-hero-note">
          <ShieldCheck size={19} />
          <span>Decisiones, precios y firmas permanecen siempre bajo su control.</span>
        </div>
      </section>

      <section className="vertice-intro vertice-container" id="servicios">
        <div>
          <p className="vertice-kicker vertice-kicker-dark"><span /> En qué intervenimos</p>
          <h2>Menos incertidumbre. Más avance documentado.</h2>
        </div>
        <p>
          No reemplazamos sus decisiones. Le damos un expediente ordenado, prioridades visibles y un siguiente paso que se puede ejecutar.
        </p>
      </section>

      <section className="vertice-services vertice-container" aria-label="Servicios Vértice Legal">
        {procedures.map(({ title, detail, icon: Icon }) => (
          <article key={title} className="vertice-service">
            <span className="vertice-service-icon"><Icon size={24} strokeWidth={1.65} /></span>
            <h3>{title}</h3>
            <p>{detail}</p>
            <a href="#consulta">Hablar del trámite <ArrowRight size={16} /></a>
          </article>
        ))}
      </section>

      <section className="vertice-process" id="proceso">
        <div className="vertice-container">
          <div className="vertice-process-heading">
            <p className="vertice-kicker vertice-kicker-dark"><span /> Cómo trabajamos</p>
            <h2>Un caso legal no debería quedarse en “lo estamos viendo”.</h2>
          </div>
          <div className="vertice-steps">
            {steps.map(([number, title, detail]) => (
              <article key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="vertice-proof vertice-container">
        <div className="vertice-proof-statement">
          <BadgeCheck size={30} strokeWidth={1.5} />
          <p>Una gestión que deja claro qué falta, quién actúa y cuándo corresponde hacerlo.</p>
        </div>
        <div className="vertice-proof-list">
          <span><Check size={16} /> Requisitos visibles</span>
          <span><Check size={16} /> Documentos trazables</span>
          <span><Check size={16} /> Seguimiento responsable</span>
        </div>
      </section>

      <section className="vertice-intake" id="consulta">
        <div className="vertice-container vertice-intake-grid">
          <div className="vertice-intake-copy">
            <p className="vertice-kicker"><span /> Valoración inicial</p>
            <h2>Cuéntenos qué necesita resolver.</h2>
            <p>Le contactaremos con una primera lectura del caso y la información necesaria para iniciar una ruta de trabajo.</p>
            <div className="vertice-contact-points">
              <p><BriefcaseBusiness size={19} /> Casos empresariales y trámites documentales.</p>
              <p><MessageCircle size={19} /> Contacto inicial sin compartir credenciales ni firmas digitales.</p>
            </div>
          </div>
          {status === "sent" ? (
            <div className="vertice-success" role="status">
              <span><Check size={30} /></span>
              <p className="vertice-kicker vertice-kicker-dark">Solicitud recibida</p>
              <h3>Su trámite ya entró a revisión.</h3>
              <p>El equipo tendrá el contexto inicial para definir el siguiente paso con usted.</p>
              <button className="vertice-text-button" type="button" onClick={() => setStatus("idle")}>Registrar otro trámite <ArrowRight size={16} /></button>
            </div>
          ) : (
            <form className="vertice-form" onSubmit={submit}>
              <label>Empresa<input name="company" required placeholder="Nombre de la empresa" /></label>
              <label>Persona de contacto<input name="contact" required placeholder="Nombre y apellido" /></label>
              <div className="vertice-form-pair">
                <label>Correo electrónico<input name="email" type="email" required placeholder="correo@empresa.com" /></label>
                <label>Teléfono<input name="phone" inputMode="tel" placeholder="8888-0000" /></label>
              </div>
              <label>Tipo de trámite<select name="procedure" defaultValue="" required><option value="" disabled>Seleccione una opción</option><option>Revisión de requisitos</option><option>Gestión de documentos</option><option>Seguimiento de expediente</option><option>Consulta legal empresarial</option></select></label>
              <label>Contexto del trámite<textarea name="detail" rows={4} placeholder="Qué necesita resolver, plazos conocidos y documentos disponibles." /></label>
              {status === "error" ? <p className="vertice-form-error" role="alert">{message}</p> : null}
              <button className="vertice-button vertice-button-dark" type="submit" disabled={status === "sending"}>{status === "sending" ? "Enviando solicitud..." : <>Enviar para valoración <Send size={17} /></>}</button>
              <small>Al enviar, autoriza el contacto sobre esta consulta. No comparta contraseñas, PIN, certificados ni firmas digitales.</small>
            </form>
          )}
        </div>
      </section>

      <footer className="vertice-footer">
        <div className="vertice-container"><span className="vertice-brand"><span className="vertice-logo-image vertice-footer-logo" style={{ position: "relative", display: "block", overflow: "hidden" }}><Image src="/vertice-legal-logo.png" alt="Vértice Legal" fill sizes="180px" /></span></span><p>Gestión legal con ruta, respaldo y seguimiento.</p></div>
      </footer>
    </main>
  );
}