import { db } from "@/lib/db";

async function ensureVehicleRentalColumns(client: typeof db = db) {
  await client.$executeRawUnsafe(`
    ALTER TABLE "Booking"
    ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS "returnedAt" TIMESTAMP NULL
  `);
}

export async function reconcileVehicleRentalStatuses(client: typeof db = db) {
  await ensureVehicleRentalColumns(client);

  const activeRentalRows = await client.$queryRaw<Array<{ vehicleId: string }>>`
    SELECT DISTINCT "vehicleId"
    FROM "Booking"
    WHERE "vehicleId" IS NOT NULL
      AND status = 'CONFIRMED'
      AND "deliveredAt" IS NOT NULL
      AND "returnedAt" IS NULL
  `;

  const activeRentalVehicleIds = activeRentalRows
    .map((row) => row.vehicleId)
    .filter((vehicleId): vehicleId is string => Boolean(vehicleId));

  if (activeRentalVehicleIds.length > 0) {
    await client.vehicle.updateMany({
      where: {
        id: { in: activeRentalVehicleIds },
        status: { not: "ON_RENT" },
      },
      data: { status: "ON_RENT" },
    });
  }

  await client.vehicle.updateMany({
    where: {
      status: "ON_RENT",
      ...(activeRentalVehicleIds.length > 0 ? { id: { notIn: activeRentalVehicleIds } } : {}),
    },
    data: { status: "ACTIVE" },
  });

  return { activeRentalVehicleIds };
}