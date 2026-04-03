/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/lib/db";

type DbLike = typeof db;

export async function ensureVehicleBlockoutsTable(client: DbLike = db) {
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
}

export async function listVehicleBlockouts() {
  await ensureVehicleBlockoutsTable();
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
