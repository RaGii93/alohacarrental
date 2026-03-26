type LegacyFeatureFlags = {
  hasAC?: boolean | null;
  hasCarPlay?: boolean | null;
  hasBackupCamera?: boolean | null;
};

type FeatureNameRef =
  | { name?: string | null; feature?: never }
  | { feature?: { name?: string | null } | null; name?: never };

export function normalizeVehicleFeatureName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function vehicleFeatureSlugFromName(value: string) {
  return normalizeVehicleFeatureName(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getLegacyVehicleFeatureNames(flags: LegacyFeatureFlags) {
  const names: string[] = [];
  if (flags.hasAC !== false) names.push("A/C");
  if (flags.hasCarPlay) names.push("Apple CarPlay");
  if (flags.hasBackupCamera) names.push("Backup Camera");
  return names;
}

export function getCategoryFeatureNames(
  category: LegacyFeatureFlags & {
    features?: FeatureNameRef[] | null;
  }
) {
  const names = [
    ...(category.features || []).map((entry) => normalizeVehicleFeatureName(entry.feature?.name || entry.name || "")).filter(Boolean),
    ...getLegacyVehicleFeatureNames(category),
  ];

  return Array.from(new Set(names));
}

export function getCategoryFeatureIds(category: {
  features?: Array<{ featureId?: string | null; feature?: { id?: string | null } | null }> | null;
}) {
  return Array.from(
    new Set(
      (category.features || [])
        .map((entry) => entry.featureId || entry.feature?.id || "")
        .filter(Boolean)
    )
  );
}
