/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";

type DbLike = typeof db;

function shouldTreatVehicleBlockoutsAsUnavailable(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "ETIMEDOUT" || error.code === "P2021";
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("timeout") ||
      message.includes("timed out") ||
      message.includes("\"vehicleblockout\"") ||
      message.includes("vehicleblockout")
    );
  }

  return false;
}

export async function ensureVehicleBlockoutsTable(client: DbLike = db) {
  try {
    await client.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "VehicleBlockout" (
        id TEXT PRIMARY KEY,
        "vehicleId" TEXT NULL REFERENCES "Vehicle"(id) ON DELETE CASCADE,
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        note TEXT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await client.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "VehicleBlockout_vehicleId_startDate_endDate_idx"
      ON "VehicleBlockout"("vehicleId", "startDate", "endDate")
    `);
    await client.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "VehicleBlockout_startDate_endDate_idx"
      ON "VehicleBlockout"("startDate", "endDate")
    `);
    return true;
  } catch (error) {
    if (shouldTreatVehicleBlockoutsAsUnavailable(error)) {
      console.warn("Vehicle blockouts are unavailable; continuing without blockout filtering.", error);
      return false;
    }
    throw error;
  }
}

export async function listVehicleBlockouts() {
  const isAvailable = await ensureVehicleBlockoutsTable();
  if (!isAvailable) return [];

  return await db.$queryRaw<Array<any>>`
    SELECT
      vb.id,
      vb."vehicleId",
      v.name AS "vehicleName",
      v."plateNumber" AS "plateNumber",
      vb."startDate",
      vb."endDate",
      vb.note,
      vb."createdAt"
    FROM "VehicleBlockout" vb
    LEFT JOIN "Vehicle" v ON v.id = vb."vehicleId"
    ORDER BY vb."startDate" ASC, vb."createdAt" DESC
  `;
}
