import { businessSectors } from "./business-taxonomy.ts";

export type MatchableOpportunity = {
  score: number;
  title: string;
  fit: string;
  tags: string[];
  keywords: string[];
  matchedTerms?: string[];
};

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
  "empresa",
  "general",
  "mantenimiento",
  "instalacion",
  "equipo",
  "equipos",
  "suministro",
  "comercializacion",
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

function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function matchesBusinessTerm(text: string, term: string) {
  const normalizedText = normalizeBusinessText(text);
  const normalizedTerm = normalizeBusinessText(term);
  if (!normalizedText || !normalizedTerm) return false;
  const pluralSuffix = normalizedTerm.endsWith("s") ? "" : "(?:s|es)?";
  return new RegExp(
    `(?:^|\\s)${escapePattern(normalizedTerm)}${pluralSuffix}(?:\\s|$)`,
  ).test(normalizedText);
}

function profileRules(products: string) {
  const normalized = normalizeBusinessText(products);
  const detectedGroups = businessSectors.flatMap((sector) => {
    const matchedTerms = sector.terms.filter((term) =>
      matchesBusinessTerm(normalized, term),
    );
    if (!matchedTerms.length) return [];
    return [
      {
        sector,
        requiredWeakTerms: (sector.weakTerms ?? []).filter((term) =>
          matchesBusinessTerm(normalized, term),
        ),
      },
    ];
  });

  if (detectedGroups.length) {
    return {
      groups: detectedGroups,
      terms: [],
    };
  }

  return {
    groups: [],
    terms: normalized
      .split(" ")
      .filter((term) => term.length >= 3 && !ignoredWords.has(term)),
  };
}

export function classifyBusinessProfile(products: string) {
  const normalized = normalizeBusinessText(products);
  return businessSectors
    .filter(({ terms }) => terms.some((term) => matchesBusinessTerm(normalized, term)))
    .map(({ label }) => label);
}

export function describeProfileSector(products: string) {
  const labels = classifyBusinessProfile(products);
  if (!labels.length) return "Actividad específica";
  return labels.slice(0, 2).join(" + ");
}

export function rankOpportunities<T extends MatchableOpportunity>(
  products: string,
  opportunities: T[],
) {
  const { groups, terms } = profileRules(products);
  if (!groups.length && !terms.length) return [];

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
      const matches = new Set<string>();
      for (const rule of groups) {
        const group = rule.sector;
        if (group.excludes.some((term) => matchesBusinessTerm(searchable, term))) {
          continue;
        }
        const groupMatches = group.terms.filter((term) =>
          matchesBusinessTerm(searchable, term),
        );
        const weakTerms = new Set(group.weakTerms ?? []);
        if (
          rule.requiredWeakTerms.length &&
          !rule.requiredWeakTerms.some((term) =>
            matchesBusinessTerm(searchable, term),
          )
        ) {
          continue;
        }
        if (
          groupMatches.length &&
          (!weakTerms.size || groupMatches.some((term) => !weakTerms.has(term)))
        ) {
          groupMatches.forEach((term) => matches.add(term));
        }
      }
      terms
        .filter((term) => matchesBusinessTerm(searchable, term))
        .forEach((term) => matches.add(term));
      return {
        opportunity,
        relevance: matches.size * 100 + opportunity.score,
        matchCount: matches.size,
        matchedTerms: [...matches],
      };
    })
    .filter(({ relevance }) => relevance >= 100)
    .sort((left, right) => right.relevance - left.relevance)
    .map(({ opportunity, matchCount, matchedTerms }) => ({
      ...opportunity,
      score: Math.min(98, 72 + matchCount * 6),
      matchedTerms,
    }));
}
