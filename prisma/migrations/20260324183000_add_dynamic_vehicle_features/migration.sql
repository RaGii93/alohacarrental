CREATE TABLE IF NOT EXISTS "VehicleFeature" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VehicleFeature_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "VehicleFeature_slug_key" ON "VehicleFeature"("slug");
CREATE INDEX IF NOT EXISTS "VehicleFeature_isActive_sortOrder_idx" ON "VehicleFeature"("isActive", "sortOrder");
CREATE INDEX IF NOT EXISTS "VehicleFeature_name_idx" ON "VehicleFeature"("name");

CREATE TABLE IF NOT EXISTS "VehicleCategoryFeature" (
  "categoryId" TEXT NOT NULL,
  "featureId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VehicleCategoryFeature_pkey" PRIMARY KEY ("categoryId","featureId")
);

CREATE INDEX IF NOT EXISTS "VehicleCategoryFeature_featureId_idx" ON "VehicleCategoryFeature"("featureId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'VehicleCategoryFeature_categoryId_fkey'
      AND table_name = 'VehicleCategoryFeature'
  ) THEN
    ALTER TABLE "VehicleCategoryFeature"
      ADD CONSTRAINT "VehicleCategoryFeature_categoryId_fkey"
      FOREIGN KEY ("categoryId") REFERENCES "VehicleCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'VehicleCategoryFeature_featureId_fkey'
      AND table_name = 'VehicleCategoryFeature'
  ) THEN
    ALTER TABLE "VehicleCategoryFeature"
      ADD CONSTRAINT "VehicleCategoryFeature_featureId_fkey"
      FOREIGN KEY ("featureId") REFERENCES "VehicleFeature"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "VehicleFeature" ("id", "name", "slug", "sortOrder", "isActive", "createdAt")
VALUES
  ('feat_air_conditioning', 'A/C', 'ac', 1, true, CURRENT_TIMESTAMP),
  ('feat_apple_carplay', 'Apple CarPlay', 'apple-carplay', 2, true, CURRENT_TIMESTAMP),
  ('feat_backup_camera', 'Backup Camera', 'backup-camera', 3, true, CURRENT_TIMESTAMP),
  ('feat_bluetooth', 'Bluetooth', 'bluetooth', 4, true, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

INSERT INTO "VehicleCategoryFeature" ("categoryId", "featureId")
SELECT vc.id, vf.id
FROM "VehicleCategory" vc
JOIN "VehicleFeature" vf ON vf.slug = 'ac'
WHERE COALESCE(vc."hasAC", true) = true
ON CONFLICT ("categoryId","featureId") DO NOTHING;

INSERT INTO "VehicleCategoryFeature" ("categoryId", "featureId")
SELECT vc.id, vf.id
FROM "VehicleCategory" vc
JOIN "VehicleFeature" vf ON vf.slug = 'apple-carplay'
WHERE COALESCE(vc."hasCarPlay", false) = true
ON CONFLICT ("categoryId","featureId") DO NOTHING;

INSERT INTO "VehicleCategoryFeature" ("categoryId", "featureId")
SELECT vc.id, vf.id
FROM "VehicleCategory" vc
JOIN "VehicleFeature" vf ON vf.slug = 'backup-camera'
WHERE COALESCE(vc."hasBackupCamera", false) = true
ON CONFLICT ("categoryId","featureId") DO NOTHING;
