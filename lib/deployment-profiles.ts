export type PublicProfile = "rental" | "saas";
export type FaqProfile = "rental" | "system";

// Keep current deployments rental-facing by default.
// For future SaaS/system deployments, switch these values in one place.
export const DEFAULT_PUBLIC_PROFILE: PublicProfile = "saas";
export const DEFAULT_FAQ_PROFILE: FaqProfile = "system";
