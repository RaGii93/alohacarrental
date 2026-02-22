import { getTenantConfig } from "./tenant";

export function getTermsPdfUrl(): string {
  return getTenantConfig().termsPdfUrl;
}