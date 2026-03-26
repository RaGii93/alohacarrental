import fs from "fs";
import { hashPassword } from "../lib/password.ts";
import { db as prisma } from "../lib/db.ts";
import type { Role } from "@prisma/client";

const seedData = JSON.parse(
  fs.readFileSync(new URL("./seed-data.json", import.meta.url), "utf8")
) as {
  appSettings: any[];
  vehicleCategories: any[];
  vehicleFeatures: any[];
  vehicleCategoryFeatures: any[];
  locations: any[];
  extras: any[];
  discountCodes: any[];
  vehicles: any[];
  vehicleBlockouts: any[];
  bookings: any[];
  bookingExtras: any[];
  bookingDiscounts: any[];
  reviews: any[];
  auditLogs: any[];
};

const users: Array<{ id: string; email: string; password: string; role: Role }> = [
  {
    id: "cmm2p2pf30000d9gdxwxwatfa",
    email: "support@endlessedgetechnology.com",
    password: "ROOT123$",
    role: "ROOT",
  },
  {
    id: "cmm2p2pwt0001d9gdqb6dyfym",
    email: "ch.rock@live.com",
    password: "Owner123!",
    role: "OWNER",
  },
];

function asDate(value: string | null | undefined) {
  return value ? new Date(value) : null;
}

async function createManyIfAny<T extends object>(
  label: string,
  model: { createMany: (args: { data: any[]; skipDuplicates: boolean }) => Promise<{ count: number }> },
  data: T[]
) {
  if (data.length === 0) {
    console.log(`✓ Ensured 0 ${label}`);
    return;
  }
  const result = await model.createMany({ data: data as any[], skipDuplicates: true });
  console.log(`✓ Ensured ${label}: created ${result.count}, skipped ${data.length - result.count}`);
}

async function main() {
  console.log("Seeding database from snapshot...");

  for (const user of users) {
    const existing = await prisma.adminUser.findFirst({
      where: {
        OR: [{ id: user.id }, { email: user.email }],
      },
      select: { id: true },
    });

    if (existing) {
      continue;
    }

    const passwordHash = await hashPassword(user.password);
    await prisma.adminUser.create({
      data: {
        id: user.id,
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
  }
  console.log(`✓ Ensured ${users.length} baseline users`);

  await createManyIfAny(
    "app settings",
    prisma.appSetting,
    seedData.appSettings.map((row) => ({
      key: row.key,
      value: row.value,
      updatedAt: new Date(row.updatedAt),
    }))
  );

  await createManyIfAny(
    "vehicle categories",
    prisma.vehicleCategory,
    (seedData.vehicleCategories as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      imageUrl: row.imageUrl,
      seats: row.seats,
      transmission: row.transmission,
      hasAC: row.hasAC,
      hasCarPlay: row.hasCarPlay,
      hasBackupCamera: row.hasBackupCamera,
      dailyRate: row.dailyRate,
      fuelChargePerQuarter: row.fuelChargePerQuarter ?? 2500,
      isActive: row.isActive,
      sortOrder: row.sortOrder,
      createdAt: new Date(row.createdAt),
    }))
  );

  await createManyIfAny(
    "vehicle features",
    (prisma as any).vehicleFeature,
    (seedData.vehicleFeatures as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sortOrder: row.sortOrder,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
    }))
  );

  await createManyIfAny(
    "vehicle category features",
    (prisma as any).vehicleCategoryFeature,
    (seedData.vehicleCategoryFeatures as any[]).map((row) => ({
      categoryId: row.categoryId,
      featureId: row.featureId,
      createdAt: new Date(row.createdAt),
    }))
  );

  await createManyIfAny(
    "locations",
    prisma.location,
    (seedData.locations as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      address: row.address,
      createdAt: new Date(row.createdAt),
    }))
  );

  await createManyIfAny(
    "extras",
    prisma.extra,
    (seedData.extras as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      pricingType: row.pricingType,
      amount: row.amount,
      isActive: row.isActive,
      createdAt: new Date(row.createdAt),
    }))
  );

  await createManyIfAny(
    "discount codes",
    prisma.discountCode,
    (seedData.discountCodes as any[]).map((row) => ({
      id: row.id,
      code: row.code,
      description: row.description,
      percentage: row.percentage,
      isActive: row.isActive,
      maxUses: row.maxUses,
      usedCount: row.usedCount,
      expiresAt: asDate(row.expiresAt),
      createdAt: new Date(row.createdAt),
    }))
  );

  await createManyIfAny(
    "vehicles",
    prisma.vehicle,
    (seedData.vehicles as any[]).map((row) => ({
      id: row.id,
      name: row.name,
      plateNumber: row.plateNumber,
      imageUrl: row.imageUrl,
      categoryId: row.categoryId,
      seats: row.seats,
      transmission: row.transmission,
      hasAC: row.hasAC,
      dailyRate: row.dailyRate,
      status: row.status,
      notes: row.notes,
      createdAt: new Date(row.createdAt),
    }))
  );

  await createManyIfAny(
    "vehicle blockouts",
    prisma.vehicleBlockout,
    (seedData.vehicleBlockouts as any[]).map((row) => ({
      id: row.id,
      vehicleId: row.vehicleId,
      startDate: new Date(row.startDate),
      endDate: new Date(row.endDate),
      note: row.note,
      createdAt: new Date(row.createdAt),
    }))
  );

  await createManyIfAny(
    "bookings",
    prisma.booking,
    (seedData.bookings as any[]).map((row) => ({
      id: row.id,
      categoryId: row.categoryId,
      vehicleId: row.vehicleId,
      customerName: row.customerName,
      customerEmail: row.customerEmail,
      customerPhone: row.customerPhone,
      flightNumber: row.flightNumber,
      birthDate: asDate(row.birthDate),
      driverLicenseNumber: row.driverLicenseNumber,
      licenseExpiryDate: asDate(row.licenseExpiryDate),
      driverLicenseUrl: row.driverLicenseUrl,
      startDate: new Date(row.startDate),
      endDate: new Date(row.endDate),
      pickupLocationId: row.pickupLocationId,
      dropoffLocationId: row.dropoffLocationId,
      pickupLocation: row.pickupLocation,
      dropoffLocation: row.dropoffLocation,
      totalAmount: row.totalAmount,
      status: row.status,
      bookingCode: row.bookingCode,
      holdExpiresAt: new Date(row.holdExpiresAt),
      paymentProofUrl: row.paymentProofUrl,
      paymentReceivedAt: asDate(row.paymentReceivedAt),
      termsAcceptedAt: asDate(row.termsAcceptedAt),
      driverLicenseDeleteAfter: asDate(row.driverLicenseDeleteAfter),
      driverLicenseDeletedAt: asDate(row.driverLicenseDeletedAt),
      notes: row.notes,
      invoiceUrl: row.invoiceUrl,
      billingDocumentType: row.billingDocumentType,
      quickBooksTransferStatus: row.quickBooksTransferStatus,
      quickBooksDocumentType: row.quickBooksDocumentType,
      quickBooksCustomerId: row.quickBooksCustomerId,
      quickBooksInvoiceId: row.quickBooksInvoiceId,
      quickBooksSalesReceiptId: row.quickBooksSalesReceiptId,
      quickBooksPaymentId: row.quickBooksPaymentId,
      quickBooksLastError: row.quickBooksLastError,
      quickBooksSyncRequestedAt: asDate(row.quickBooksSyncRequestedAt),
      quickBooksSyncedAt: asDate(row.quickBooksSyncedAt),
      createdAt: new Date(row.createdAt),
    }))
  );

  await createManyIfAny(
    "booking extras",
    prisma.bookingExtra,
    (seedData.bookingExtras as any[]).map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      extraId: row.extraId,
      quantity: row.quantity,
      lineTotal: row.lineTotal,
      createdAt: new Date(row.createdAt),
    }))
  );

  await createManyIfAny(
    "booking discounts",
    prisma.bookingDiscount,
    (seedData.bookingDiscounts as any[]).map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      discountCodeId: row.discountCodeId,
      percentage: row.percentage,
      amount: row.amount,
      createdAt: new Date(row.createdAt),
    }))
  );

  await createManyIfAny(
    "reviews",
    prisma.review,
    (seedData.reviews as any[]).map((row) => ({
      id: row.id,
      bookingId: row.bookingId,
      bookingCode: row.bookingCode,
      customerName: row.customerName,
      rating: row.rating,
      comment: row.comment,
      isVisible: row.isVisible,
      createdAt: new Date(row.createdAt),
    }))
  );

  await createManyIfAny(
    "audit logs",
    prisma.auditLog,
    (seedData.auditLogs as any[]).map((row) => ({
      id: row.id,
      adminUserId: row.adminUserId,
      action: row.action,
      bookingId: row.bookingId,
      createdAt: new Date(row.createdAt),
    }))
  );

  console.log("✅ Snapshot baseline seeding completed");
}

main()
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
