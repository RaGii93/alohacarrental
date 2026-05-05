type LegacyFeatureFlags = {
  hasAC?: boolean | null;
  hasCarPlay?: boolean | null;
  hasBackupCamera?: boolean | null;
};

type FeatureNameRef =
  | { name?: string | null; feature?: never }
  | { feature?: { name?: string | null; isActive?: boolean | null } | null; name?: never };

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

function mergeOrderedUnique(names: string[]) {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const name of names) {
    const normalized = normalizeVehicleFeatureName(name);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    ordered.push(normalized);
  }

  return ordered;
}

export function getCategoryFeatureNames(
  category: LegacyFeatureFlags & {
    features?: FeatureNameRef[] | null;
  }
) {
  const relations = category.features || [];
  const hasFeatureRelations = relations.length > 0;
  const relationNames = relations
    .filter((entry) => entry.feature?.isActive !== false)
    .map((entry) => entry.feature?.name || entry.name || "")
    .filter(Boolean);

  if (hasFeatureRelations) {
    return mergeOrderedUnique(relationNames);
  }

  return mergeOrderedUnique([...relationNames, ...getLegacyVehicleFeatureNames(category)]);
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
