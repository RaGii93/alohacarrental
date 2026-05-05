import { Prisma } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import { db } from "@/lib/db";
import { getBlobProxyUrl } from "@/lib/blob";
import { normalizeVehicleFeatureName } from "@/lib/vehicle-features";

const publicCategoryBaseSelect = {
  id: true,
  name: true,
  description: true,
  imageUrl: true,
  dailyRate: true,
  seats: true,
  transmission: true,
  hasAC: true,
  hasCarPlay: true,
  hasBackupCamera: true,
} satisfies Prisma.VehicleCategorySelect;

const publicCategorySelectWithFeatures = {
  ...publicCategoryBaseSelect,
  features: {
    include: { feature: true },
    orderBy: { feature: { sortOrder: "asc" } },
  },
} satisfies Prisma.VehicleCategorySelect;

const publicLocationSelectWithCoordinates = {
  id: true,
  name: true,
  code: true,
  address: true,
  latitude: true,
  longitude: true,
} as unknown as Prisma.LocationSelect;

const publicLocationBaseSelect = {
  id: true,
  name: true,
  code: true,
  address: true,
} satisfies Prisma.LocationSelect;

type PublicCategoryWithOptionalFeatures = Prisma.VehicleCategoryGetPayload<{
  select: typeof publicCategorySelectWithFeatures;
}> | Prisma.VehicleCategoryGetPayload<{
  select: typeof publicCategoryBaseSelect;
}>;

export type PublicVehicleCategoryCard = {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  dailyRate: number;
  seats: number;
  transmission: "AUTOMATIC" | "MANUAL";
  hasAC: boolean;
  hasCarPlay: boolean;
  hasBackupCamera: boolean;
  features: Array<{ name: string; iconName: string | null }>;
};

function resolvePublicCategoryImageUrl(imageUrl: string | null) {
  if (!imageUrl) return null;
  return imageUrl.startsWith("/") ? imageUrl : getBlobProxyUrl(imageUrl) || imageUrl;
}

function getPublicCategoryFeatures(category: PublicCategoryWithOptionalFeatures) {
  const relations = ("features" in category ? category.features || [] : []) as Array<{
    feature?: { name?: string | null; iconName?: string | null; isActive?: boolean | null } | null;
  }>;
  const hasFeatureRelations = relations.length > 0;
  const relationFeatures = relations
    .filter((entry) => entry.feature?.isActive !== false)
    .map((entry) => ({
      name: normalizeVehicleFeatureName(entry.feature?.name || ""),
      iconName: entry.feature?.iconName || null,
    }))
    .filter((entry) => entry.name);

  if (hasFeatureRelations) {
    return relationFeatures;
  }

  const seen = new Set(relationFeatures.map((entry) => entry.name));
  const ordered = [...relationFeatures];

  for (const legacyName of [
    category.hasAC ? "A/C" : "",
    category.hasCarPlay ? "Apple CarPlay" : "",
    category.hasBackupCamera ? "Backup Camera" : "",
  ].filter(Boolean)) {
    const normalized = normalizeVehicleFeatureName(legacyName);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    ordered.push({ name: normalized, iconName: null });
  }

  return ordered;
}

function toPublicVehicleCategoryCard(category: PublicCategoryWithOptionalFeatures): PublicVehicleCategoryCard {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    imageUrl: resolvePublicCategoryImageUrl(category.imageUrl),
    dailyRate: category.dailyRate,
    seats: category.seats,
    transmission: category.transmission,
    hasAC: Boolean(category.hasAC),
    hasCarPlay: Boolean(category.hasCarPlay),
    hasBackupCamera: Boolean(category.hasBackupCamera),
    features: getPublicCategoryFeatures(category),
  };
}

function isMissingDatabaseObjectError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2021" || error.code === "P2022")
  );
}

export async function getPublicVehicleCategories(options?: { take?: number }) {
  noStore();

  const query = {
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" as const }, { name: "asc" as const }],
    ...(typeof options?.take === "number" ? { take: options.take } : {}),
  };

  try {
    const categories = await db.vehicleCategory.findMany({
      ...query,
      select: publicCategorySelectWithFeatures,
    });
    return categories.map(toPublicVehicleCategoryCard);
  } catch (error) {
    if (!isMissingDatabaseObjectError(error)) throw error;
  }

  try {
    const categories = await db.vehicleCategory.findMany({
      ...query,
      select: publicCategoryBaseSelect,
    });
    return categories.map(toPublicVehicleCategoryCard);
  } catch (error) {
    if (!isMissingDatabaseObjectError(error)) throw error;
    return [];
  }
}

export async function getPublicLocations() {
  noStore();

  try {
    return await db.location.findMany({
      select: publicLocationSelectWithCoordinates,
      orderBy: { name: "asc" },
    });
  } catch (error) {
    if (!isMissingDatabaseObjectError(error)) throw error;
  }

  try {
    const locations = await db.location.findMany({
      select: publicLocationBaseSelect,
      orderBy: { name: "asc" },
    });

    return locations.map((location) => ({
      ...location,
      latitude: null,
      longitude: null,
    }));
  } catch (error) {
    if (!isMissingDatabaseObjectError(error)) throw error;
    return [];
  }
}
