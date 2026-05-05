import { z } from "zod";

export const MINIMUM_DRIVER_AGE = 21;

export const additionalDriverSchema = z.object({
  id: z.string().optional(),
  fullName: z.string().trim().min(2, "Full name is required"),
  birthDate: z.date(),
  driverLicenseNumber: z.string().trim().min(1, "Driver license number is required"),
  licenseExpiryDate: z.date(),
  driverLicenseUrl: z.string().url("Driver license upload is required"),
  driverLicenseDeletedAt: z.date().nullable().optional(),
});

export const additionalDriversSchema = z.array(additionalDriverSchema);

export type AdditionalDriverInput = z.infer<typeof additionalDriverSchema>;

export function isAdditionalDriverAdult(birthDate: Date | null | undefined, today = new Date()) {
  if (!birthDate) return false;
  const threshold = new Date(today);
  threshold.setFullYear(threshold.getFullYear() - MINIMUM_DRIVER_AGE);
  return birthDate <= threshold;
}

export function isAdditionalDriverLicenseValid(licenseExpiryDate: Date | null | undefined, rentalStartDate: Date | null | undefined) {
  if (!licenseExpiryDate || !rentalStartDate) return false;
  return licenseExpiryDate > rentalStartDate;
}

export function serializeAdditionalDrivers(drivers: Array<{
  id?: string;
  fullName: string;
  birthDate: Date | null;
  driverLicenseNumber: string;
  licenseExpiryDate: Date | null;
  driverLicenseUrl: string;
}>) {
  return JSON.stringify(
    drivers.map((driver) => ({
      id: driver.id,
      fullName: driver.fullName,
      birthDate: driver.birthDate ? driver.birthDate.toISOString() : null,
      driverLicenseNumber: driver.driverLicenseNumber,
      licenseExpiryDate: driver.licenseExpiryDate ? driver.licenseExpiryDate.toISOString() : null,
      driverLicenseUrl: driver.driverLicenseUrl,
    }))
  );
}

export async function parseAdditionalDriversPayload(
  raw: string | null | undefined,
  rentalStartDate: Date
): Promise<AdditionalDriverInput[]> {
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid additional driver payload");
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Invalid additional driver payload");
  }

  const normalized = parsed.map((item) => {
    const value = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      id: typeof value.id === "string" && value.id.trim() ? value.id.trim() : undefined,
      fullName: String(value.fullName || ""),
      birthDate: new Date(String(value.birthDate || "")),
      driverLicenseNumber: String(value.driverLicenseNumber || ""),
      licenseExpiryDate: new Date(String(value.licenseExpiryDate || "")),
      driverLicenseUrl: String(value.driverLicenseUrl || ""),
      driverLicenseDeletedAt: null,
    };
  });

  const validated = await additionalDriversSchema.parseAsync(normalized);

  validated.forEach((driver, index) => {
    if (Number.isNaN(driver.birthDate.getTime())) {
      throw new Error(`Additional driver ${index + 1} has an invalid birth date`);
    }
    if (Number.isNaN(driver.licenseExpiryDate.getTime())) {
      throw new Error(`Additional driver ${index + 1} has an invalid license expiry date`);
    }
    if (!isAdditionalDriverAdult(driver.birthDate)) {
      throw new Error(`Additional driver ${index + 1} must be at least ${MINIMUM_DRIVER_AGE} years old`);
    }
    if (!isAdditionalDriverLicenseValid(driver.licenseExpiryDate, rentalStartDate)) {
      throw new Error(`Additional driver ${index + 1} must have a valid license for the rental start date`);
    }
  });

  return validated;
}
