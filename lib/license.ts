export type LicenseStatus = "ACTIVE" | "SUSPENDED";

export function getLicenseStatus(): LicenseStatus {
  const status = process.env.LICENSE_STATUS as LicenseStatus;
  return status === "SUSPENDED" ? "SUSPENDED" : "ACTIVE";
}

export function getLicenseMessage(): string {
  return process.env.LICENSE_MESSAGE || "Your license has been suspended. Please contact support.";
}

export function isLicenseActive(): boolean {
  return getLicenseStatus() === "ACTIVE";
}

export function checkLicense(userRole?: string): {
  isAllowed: boolean;
  message?: string;
} {
  // ROOT users bypass license gate
  if (userRole === "ROOT") {
    return { isAllowed: true };
  }

  if (!isLicenseActive()) {
    return {
      isAllowed: false,
      message: getLicenseMessage(),
    };
  }

  return { isAllowed: true };
}
