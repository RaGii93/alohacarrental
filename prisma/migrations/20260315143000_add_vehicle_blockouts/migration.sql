CREATE TABLE IF NOT EXISTS "VehicleBlockout" (
  id TEXT PRIMARY KEY,
  "vehicleId" TEXT NULL REFERENCES "Vehicle"(id) ON DELETE CASCADE,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  note TEXT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "VehicleBlockout_vehicleId_startDate_endDate_idx"
  ON "VehicleBlockout"("vehicleId", "startDate", "endDate");

CREATE INDEX IF NOT EXISTS "VehicleBlockout_startDate_endDate_idx"
  ON "VehicleBlockout"("startDate", "endDate");
