ALTER TABLE "VehicleCategory"
ADD COLUMN IF NOT EXISTS "fuelChargePerQuarter" INTEGER NOT NULL DEFAULT 2500;

UPDATE "VehicleCategory"
SET "fuelChargePerQuarter" = 5000
WHERE COALESCE("fuelChargePerQuarter", 2500) = 2500
  AND (
    lower(COALESCE(name, '')) LIKE '%van%'
    OR lower(COALESCE(name, '')) LIKE '%bus%'
    OR lower(COALESCE(description, '')) LIKE '%van%'
    OR lower(COALESCE(description, '')) LIKE '%bus%'
    OR seats >= 9
  );
