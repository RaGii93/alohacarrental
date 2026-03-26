import { toLocalePath } from "@/lib/seo";
import {
  buildHelpSearchIndex,
  getAllHelpDocs,
  getHelpUiCopy,
  type HelpDoc,
  type HelpLocale,
  type HelpSearchEntry,
  type HelpUiCopy,
  isHelpLocale,
} from "@/lib/help-docs";

export type HelpAssistantSource = {
  title: string;
  href: string;
};

export type HelpAssistantReply = {
  fallback: boolean;
  intro: string;
  bullets: string[];
  sources: HelpAssistantSource[];
};

const ASSISTANT_COPY: Record<HelpLocale, { intro: string; noQuery: string }> = {
  en: {
    intro: "Based on the current Help Center docs:",
    noQuery: "Ask a product question about bookings, inspections, billing, or vehicle operations.",
  },
  es: {
    intro: "Según la documentación actual del Centro de ayuda:",
    noQuery: "Haz una pregunta del producto sobre reservas, inspecciones, facturación o operaciones del vehículo.",
  },
  nl: {
    intro: "Op basis van de huidige Helpcentrum-documentatie:",
    noQuery: "Stel een productvraag over boekingen, inspecties, facturatie of voertuigoperaties.",
  },
};

type SectionCandidate = {
  doc: HelpDoc;
  heading: string;
  summary: string;
  bullets: string[];
  score: number;
};

function normalizeLocale(locale: string): HelpLocale {
  return isHelpLocale(locale) ? locale : "en";
}

function normalizeText(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(input: string): string[] {
  return normalizeText(input)
    .split(" ")
    .filter((token) => token.length > 1);
}

function scoreText(text: string, terms: string[], weight: number) {
  const normalized = normalizeText(text);
  let score = 0;
  for (const term of terms) {
    if (!term) continue;
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = normalized.match(new RegExp(escaped, "g"));
    if (matches?.length) score += matches.length * weight;
  }
  return score;
}

function getTopDocs(locale: string, query: string): HelpSearchEntry[] {
  const terms = tokenize(query);
  const phrase = normalizeText(query);

  return buildHelpSearchIndex(locale)
    .map((entry) => {
      let score = 0;
      score += scoreText(entry.title, terms, 14);
      score += scoreText(entry.description, terms, 10);
      score += scoreText(entry.headings.join(" "), terms, 9);
      score += scoreText(entry.keywords.join(" "), terms, 11);
      score += scoreText(entry.content, terms, 3);
      if (phrase && normalizeText(entry.title).includes(phrase)) score += 24;
      if (phrase && normalizeText(entry.content).includes(phrase)) score += 10;
      return { ...entry, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

function getTopSections(locale: string, query: string): SectionCandidate[] {
  const docs = getAllHelpDocs(locale);
  const terms = tokenize(query);
  const phrase = normalizeText(query);

  return docs
    .flatMap((doc) =>
      doc.sections.map((section) => {
        const fullText = [doc.title, doc.description, section.heading, section.summary, ...section.bullets].join(" ");
        let score = 0;
        score += scoreText(doc.title, terms, 10);
        score += scoreText(section.heading, terms, 12);
        score += scoreText(section.summary, terms, 8);
        score += scoreText(section.bullets.join(" "), terms, 6);
        if (phrase && normalizeText(fullText).includes(phrase)) score += 10;
        return { doc, heading: section.heading, summary: section.summary, bullets: section.bullets, score };
      })
    )
    .filter((section) => section.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function dedupeLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const line of lines) {
    const normalized = normalizeText(line);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    output.push(line);
  }
  return output;
}

function buildFallback(copy: HelpUiCopy): HelpAssistantReply {
  return {
    fallback: true,
    intro: copy.assistantFallback,
    bullets: [],
    sources: [],
  };
}

export async function answerHelpQuestion(locale: string, query: string): Promise<HelpAssistantReply> {
  const safeLocale = normalizeLocale(locale);
  const copy = getHelpUiCopy(safeLocale);
  const assistantCopy = ASSISTANT_COPY[safeLocale];
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      fallback: true,
      intro: assistantCopy.noQuery,
      bullets: [],
      sources: [],
    };
  }

  const topDocs = getTopDocs(safeLocale, trimmed);
  const topSections = getTopSections(safeLocale, trimmed);

  if (!topDocs.length || !topSections.length) {
    return buildFallback(copy);
  }

  const bullets = dedupeLines(
    topSections.flatMap((section) => [section.summary, ...section.bullets])
  ).slice(0, 5);

  if (!bullets.length) {
    return buildFallback(copy);
  }

  const sources = topDocs.slice(0, 3).map((doc) => ({
    title: doc.title,
    href: toLocalePath(safeLocale, doc.href),
  }));

  return {
    fallback: false,
    intro: assistantCopy.intro,
    bullets,
    sources,
  };
}

