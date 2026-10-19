export function initialBookingStatus(source: string, role?: string | null): "PENDING" | "CONFIRMED" {
  if (source !== "admin") return "PENDING";
  if (role !== "ROOT" && role !== "OWNER") throw new Error("Unauthorized");
  return "CONFIRMED";
}
