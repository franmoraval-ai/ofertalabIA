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
    excludes: [
      "alimentacion ininterrumpida",
      "sistema de alimentacion",
      "fuente de alimentacion",
      "alimentacion electrica",
      "ups",
      "alimento para animales",
      "alimento animal",
      "analisis microbiologico",
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
    excludes: [],
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
    excludes: [],
  },
  {
    label: "Limpieza",
    terms: ["limpieza", "aseo", "desinfeccion", "higiene", "sanitizacion"],
    excludes: [],
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
    excludes: [],
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

function profileRules(products: string) {
  const normalized = normalizeBusinessText(products);
  const detectedGroups = synonymGroups.filter(({ terms }) =>
    terms.some((term) => normalized.includes(term)),
  );

  if (detectedGroups.length) {
    return {
      terms: [...new Set(detectedGroups.flatMap(({ terms }) => terms))],
      excludes: [...new Set(detectedGroups.flatMap(({ excludes }) => excludes))],
    };
  }

  return {
    terms: normalized
      .split(" ")
      .filter((term) => term.length >= 3 && !ignoredWords.has(term)),
    excludes: [],
  };
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
  const { terms, excludes } = profileRules(products);
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
      if (excludes.some((term) => searchable.includes(term))) {
        return { opportunity, relevance: 0, matchCount: 0 };
      }
      const matches = terms.filter((term) => searchable.includes(term));
      return {
        opportunity,
        relevance: matches.length * 100 + opportunity.score,
        matchCount: matches.length,
      };
    })
    .filter(({ relevance }) => relevance >= 100)
    .sort((left, right) => right.relevance - left.relevance)
    .map(({ opportunity, matchCount }) => ({
      ...opportunity,
      score: Math.min(98, 72 + matchCount * 6),
    }));
}
