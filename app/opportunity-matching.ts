export type MatchableOpportunity = {
  score: number;
  title: string;
  fit: string;
  tags: string[];
  keywords: string[];
};

const synonymGroups = [
  {
    label: "Alimentos y alimentación",
    terms: [
      "alimento",
      "alimentacion",
      "comida",
      "catering",
      "comedor",
      "restaurante",
      "abarrote",
      "viveres",
      "cocina",
      "fruta",
      "verdura",
    ],
  },
  {
    label: "Seguridad electrónica",
    terms: [
      "seguridad",
      "camara",
      "videovigilancia",
      "alarma",
      "monitoreo",
      "vigilancia",
      "proteccion",
    ],
  },
  {
    label: "Climatización",
    terms: [
      "aire acondicionado",
      "climatizacion",
      "refrigeracion",
      "ventilacion",
      "hvac",
    ],
  },
  {
    label: "Limpieza",
    terms: ["limpieza", "aseo", "desinfeccion", "higiene", "sanitizacion"],
  },
  {
    label: "Tecnología",
    terms: [
      "computadora",
      "tecnologia",
      "software",
      "informatica",
      "servidor",
      "redes",
    ],
  },
] as const;

const ignoredWords = new Set([
  "con",
  "del",
  "las",
  "los",
  "para",
  "por",
  "que",
  "servicio",
  "servicios",
  "producto",
  "productos",
  "venta",
  "vendo",
]);

export function normalizeBusinessText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function profileTerms(products: string) {
  const normalized = normalizeBusinessText(products);
  const detectedGroups = synonymGroups.filter(({ terms }) =>
    terms.some((term) => normalized.includes(term)),
  );

  if (detectedGroups.length) {
    return [...new Set(detectedGroups.flatMap(({ terms }) => terms))];
  }

  return normalized
    .split(" ")
    .filter((term) => term.length >= 3 && !ignoredWords.has(term));
}

export function describeProfileSector(products: string) {
  const normalized = normalizeBusinessText(products);
  const detected = synonymGroups.find(({ terms }) =>
    terms.some((term) => normalized.includes(term)),
  );
  return detected?.label ?? "Actividad específica";
}

export function rankOpportunities<T extends MatchableOpportunity>(
  products: string,
  opportunities: T[],
) {
  const terms = profileTerms(products);
  if (!terms.length) return [];

  return opportunities
    .map((opportunity) => {
      const searchable = normalizeBusinessText(
        [
          opportunity.title,
          opportunity.fit,
          opportunity.tags.join(" "),
          opportunity.keywords.join(" "),
        ].join(" "),
      );
      const matches = terms.filter((term) => searchable.includes(term));
      return {
        opportunity,
        relevance: matches.length * 100 + opportunity.score,
      };
    })
    .filter(({ relevance }) => relevance >= 100)
    .sort((left, right) => right.relevance - left.relevance)
    .map(({ opportunity }) => opportunity);
}
