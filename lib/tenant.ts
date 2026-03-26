import type { CSSProperties } from "react";
import { getTenantSettings, type TenantSettings } from "@/lib/settings";

export interface TenantConfig {
  tenantName: string;
  logoUrl: string;
  phone: string;
  whatsapp: string;
  whatsappUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  tiktokUrl?: string;
  email: string;
  address: string;
  currency: string;
  paymentInstructions: string;
  termsPdfUrl: string;
  theme: TenantSettings["theme"];
}

export async function getTenantConfig(): Promise<TenantConfig> {
  return await getTenantSettings();
}

export function buildTenantCssVariables(tenant: TenantConfig): CSSProperties {
  return {
    ["--primary" as any]: tenant.theme.primary,
    ["--primary-foreground" as any]: tenant.theme.primaryForeground,
    ["--accent" as any]: tenant.theme.accent,
    ["--accent-foreground" as any]: tenant.theme.accentForeground,
    ["--ring" as any]: tenant.theme.ring,
    ["--sidebar-primary" as any]: tenant.theme.sidebarPrimary,
    ["--sidebar-primary-foreground" as any]: tenant.theme.sidebarPrimaryForeground,
    ["--sidebar-accent" as any]: tenant.theme.sidebarAccent,
    ["--sidebar-accent-foreground" as any]: tenant.theme.sidebarAccentForeground,
  };
}

function clampUnit(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseHslToken(token: string) {
  const parts = String(token || "")
    .trim()
    .split(/\s+/)
    .map((part) => part.replace("%", ""));
  const [h, s, l] = parts.map(Number);
  return {
    h: clampUnit(Number.isFinite(h) ? h : 0, 0, 360),
    s: clampUnit(Number.isFinite(s) ? s : 0, 0, 100),
    l: clampUnit(Number.isFinite(l) ? l : 0, 0, 100),
  };
}

function hslToRgb(token: string) {
  const { h, s, l } = parseHslToken(token);
  const hue = h / 360;
  const sat = s / 100;
  const light = l / 100;

  if (sat === 0) {
    return { r: light, g: light, b: light };
  }

  const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
  const p = 2 * light - q;
  const hueToChannel = (t: number) => {
    let next = t;
    if (next < 0) next += 1;
    if (next > 1) next -= 1;
    if (next < 1 / 6) return p + (q - p) * 6 * next;
    if (next < 1 / 2) return q;
    if (next < 2 / 3) return p + (q - p) * (2 / 3 - next) * 6;
    return p;
  };

  return {
    r: hueToChannel(hue + 1 / 3),
    g: hueToChannel(hue),
    b: hueToChannel(hue - 1 / 3),
  };
}

function channelToHex(value: number) {
  return Math.round(clampUnit(value, 0, 1) * 255)
    .toString(16)
    .padStart(2, "0");
}

export function tenantThemeTokenToHex(token: string) {
  const { r, g, b } = hslToRgb(token);
  return `#${channelToHex(r)}${channelToHex(g)}${channelToHex(b)}`;
}

export function tenantThemeTokenToPdfRgb(token: string) {
  return hslToRgb(token);
}
