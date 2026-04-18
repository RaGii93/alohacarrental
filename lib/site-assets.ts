import { existsSync } from "node:fs";
import path from "node:path";

const PUBLIC_DIR = path.join(process.cwd(), "public");

const LOGO_CANDIDATES = [
  "/home/logo.png",
  "/images/Logo.png",
  "/images/icon.png",
  "/icon.png",
  "/apple-icon.png",
] as const;

function toPublicFilePath(assetPath: string) {
  return path.join(PUBLIC_DIR, assetPath.replace(/^\/+/, ""));
}

export function resolvePublicAssetPath(assetPath?: string | null): string | null {
  const normalized = String(assetPath || "").trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const publicPath = normalized.startsWith("/") ? normalized : `/${normalized}`;
  return existsSync(toPublicFilePath(publicPath)) ? publicPath : null;
}

export function getDetectedLogoPath(preferredPath?: string | null): string {
  const preferred = resolvePublicAssetPath(preferredPath);
  if (preferred) return preferred;

  for (const candidate of LOGO_CANDIDATES) {
    if (existsSync(toPublicFilePath(candidate))) {
      return candidate;
    }
  }

  return "/icon.png";
}

export const BRAND_LOGO_ALT = "Aloha Bonaire Car Rental logo";
