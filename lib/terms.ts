import { readFile } from "node:fs/promises";
import path from "node:path";
import { getTenantConfig } from "./tenant";
import { getBlobProxyUrl } from "./blob";

const localizedTermsFilenames = {
  en: ["Terms and Conditions  ALoha.pdf"],
  nl: ["Algemene Voorwaarden  Aloha.pdf"],
  es: ["Términos y Condiciones Aloha.pdf"],
} as const;

function coerceTermsLocale(locale: string | null | undefined): keyof typeof localizedTermsFilenames | null {
  const normalized = String(locale || "").trim().toLowerCase();
  if (normalized === "en" || normalized.startsWith("en-")) return "en";
  if (normalized === "nl" || normalized.startsWith("nl-")) return "nl";
  if (normalized === "es" || normalized.startsWith("es-")) return "es";
  return null;
}

async function findLocalizedTermsUrl(locale: string | null | undefined) {
  const matchedLocale = coerceTermsLocale(locale);
  if (!matchedLocale) return null;

  for (const filename of localizedTermsFilenames[matchedLocale]) {
    try {
      await readFile(path.join(process.cwd(), "public", filename));
      return `/${encodeURI(filename)}`;
    } catch {}
  }

  return null;
}

export async function getTermsPdfUrl(locale?: string): Promise<string> {
  const localizedUrl = await findLocalizedTermsUrl(locale);
  if (localizedUrl) return localizedUrl;
  return (await getTenantConfig()).termsPdfUrl;
}

function guessTermsFilename(sourceUrl: string) {
  try {
    const parsed = new URL(sourceUrl, "http://localhost");
    const lastSegment = parsed.pathname.split("/").filter(Boolean).at(-1);
    if (lastSegment && lastSegment.toLowerCase().endsWith(".pdf")) return decodeURIComponent(lastSegment);
  } catch {}
  return "terms-and-conditions.pdf";
}

async function tryReadLocalTermsFile(sourceUrl: string) {
  const candidates = new Set<string>();

  if (sourceUrl.startsWith("/")) {
    candidates.add(path.join(process.cwd(), "public", decodeURIComponent(sourceUrl.replace(/^\/+/, ""))));
  } else {
    try {
      const parsed = new URL(sourceUrl);
      const pathname = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
      if (pathname) {
        candidates.add(path.join(process.cwd(), "public", pathname));
      }
      const basename = path.basename(decodeURIComponent(parsed.pathname));
      if (basename) {
        candidates.add(path.join(process.cwd(), "public", basename));
      }
    } catch {}
  }

  for (const candidate of candidates) {
    try {
      return await readFile(candidate);
    } catch {}
  }

  return null;
}

export async function getTermsEmailAttachment(locale?: string): Promise<{
  url: string | null;
  attachment?: {
    filename: string;
    content: Buffer;
    contentType: string;
  };
}> {
  const sourceUrl = (await getTermsPdfUrl(locale))?.trim();
  if (!sourceUrl) return { url: null };

  const publicUrl = sourceUrl.startsWith("/")
    ? getBlobProxyUrl(sourceUrl, { download: true }) || sourceUrl
    : sourceUrl;

  try {
    const localContent = await tryReadLocalTermsFile(sourceUrl);
    if (localContent) {
      return {
        url: publicUrl,
        attachment: {
          filename: guessTermsFilename(sourceUrl),
          content: localContent,
          contentType: "application/pdf",
        },
      };
    }

    if (sourceUrl.startsWith("/")) {
      return { url: publicUrl };
    }

    const response = await fetch(sourceUrl);
    if (!response.ok) return { url: publicUrl };
    const arrayBuffer = await response.arrayBuffer();
    return {
      url: publicUrl,
      attachment: {
        filename: guessTermsFilename(sourceUrl),
        content: Buffer.from(arrayBuffer),
        contentType: "application/pdf",
      },
    };
  } catch {
    return { url: publicUrl };
  }
}
