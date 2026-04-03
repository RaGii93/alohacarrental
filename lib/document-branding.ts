import { getBaseUrl } from "@/lib/seo";

export const documentBranding = {
  canvas: "#fffaf6",
  surface: "#ffffff",
  warmSurface: "#fff5ea",
  blushSurface: "#fff1f7",
  oceanSurface: "#eef4ff",
  line: "#f0dcc8",
  title: "#8d4a0b",
  body: "#2e4086",
  muted: "#6d7aa8",
  orange: "#ff911c",
  yellow: "#ffd23f",
  pink: "#e462aa",
  successBg: "#fff4dd",
  successText: "#8d4a0b",
  footerText: "#7b7094",
} as const;

export function resolveTenantAssetUrl(rawUrl: string | undefined) {
  const assetUrl = String(rawUrl || "").trim();
  if (!assetUrl) return "";
  if (assetUrl.startsWith("http://") || assetUrl.startsWith("https://")) return assetUrl;
  if (!assetUrl.startsWith("/")) return "";
  return `${getBaseUrl().replace(/\/$/, "")}${assetUrl}`;
}

export function escapeHtml(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function hexToRgbUnit(hex: string) {
  const normalized = hex.replace("#", "").trim();
  const full = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => `${char}${char}`)
        .join("")
    : normalized;

  const value = full.padEnd(6, "0").slice(0, 6);
  return {
    r: parseInt(value.slice(0, 2), 16) / 255,
    g: parseInt(value.slice(2, 4), 16) / 255,
    b: parseInt(value.slice(4, 6), 16) / 255,
  };
}
