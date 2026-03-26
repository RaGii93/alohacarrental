import { readFile } from "node:fs/promises";
import path from "node:path";
import { getTenantConfig } from "./tenant";
import { getBlobProxyUrl } from "./blob";

export async function getTermsPdfUrl(): Promise<string> {
  return (await getTenantConfig()).termsPdfUrl;
}

function guessTermsFilename(sourceUrl: string) {
  try {
    const parsed = new URL(sourceUrl, "http://localhost");
    const lastSegment = parsed.pathname.split("/").filter(Boolean).at(-1);
    if (lastSegment && lastSegment.toLowerCase().endsWith(".pdf")) return lastSegment;
  } catch {}
  return "terms-and-conditions.pdf";
}

async function tryReadLocalTermsFile(sourceUrl: string) {
  const candidates = new Set<string>();

  if (sourceUrl.startsWith("/")) {
    candidates.add(path.join(process.cwd(), "public", sourceUrl.replace(/^\/+/, "")));
  } else {
    try {
      const parsed = new URL(sourceUrl);
      const pathname = parsed.pathname.replace(/^\/+/, "");
      if (pathname) {
        candidates.add(path.join(process.cwd(), "public", pathname));
      }
      const basename = path.basename(parsed.pathname);
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

export async function getTermsEmailAttachment(): Promise<{
  url: string | null;
  attachment?: {
    filename: string;
    content: Buffer;
    contentType: string;
  };
}> {
  const sourceUrl = (await getTermsPdfUrl())?.trim();
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
