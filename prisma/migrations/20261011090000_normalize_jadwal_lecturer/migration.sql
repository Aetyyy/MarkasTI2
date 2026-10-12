-- Preserve the legacy lecturer labels by creating any missing master-data rows
-- before moving schedules to the Dosen relation.
ALTER TABLE "jadwal"
ADD COLUMN IF NOT EXISTS "dosenId" INTEGER;

UPDATE "jadwal" AS schedule
SET "dosenId" = NULL
WHERE schedule."dosenId" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "dosen" AS lecturer
    WHERE lecturer."id" = schedule."dosenId"
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'dosen' AND column_name = 'updatedAt'
  ) THEN
    EXECUTE $query$
      INSERT INTO "dosen" ("name", "createdAt", "updatedAt")
      SELECT legacy."name", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM (
        SELECT DISTINCT ON (LOWER(BTRIM(schedule."lecturer")))
          BTRIM(schedule."lecturer") AS "name",
          LOWER(BTRIM(schedule."lecturer")) AS normalized_name
        FROM "jadwal" AS schedule
        WHERE schedule."lecturer" IS NOT NULL
          AND BTRIM(schedule."lecturer") <> ''
        ORDER BY LOWER(BTRIM(schedule."lecturer")), BTRIM(schedule."lecturer")
      ) AS legacy
      WHERE NOT EXISTS (
        SELECT 1 FROM "dosen" AS lecturer
        WHERE LOWER(BTRIM(lecturer."name")) = legacy.normalized_name
      )
    $query$;
  ELSE
    EXECUTE $query$
      INSERT INTO "dosen" ("name", "createdAt")
      SELECT legacy."name", CURRENT_TIMESTAMP
      FROM (
        SELECT DISTINCT ON (LOWER(BTRIM(schedule."lecturer")))
          BTRIM(schedule."lecturer") AS "name",
          LOWER(BTRIM(schedule."lecturer")) AS normalized_name
        FROM "jadwal" AS schedule
        WHERE schedule."lecturer" IS NOT NULL
          AND BTRIM(schedule."lecturer") <> ''
        ORDER BY LOWER(BTRIM(schedule."lecturer")), BTRIM(schedule."lecturer")
      ) AS legacy
      WHERE NOT EXISTS (
        SELECT 1 FROM "dosen" AS lecturer
        WHERE LOWER(BTRIM(lecturer."name")) = legacy.normalized_name
      )
    $query$;
  END IF;
END $$;

UPDATE "jadwal" AS schedule
SET "dosenId" = (
  SELECT MIN(lecturer."id")
  FROM "dosen" AS lecturer
  WHERE LOWER(BTRIM(lecturer."name")) = LOWER(BTRIM(schedule."lecturer"))
)
WHERE schedule."dosenId" IS NULL
  AND schedule."lecturer" IS NOT NULL
  AND BTRIM(schedule."lecturer") <> '';

CREATE INDEX IF NOT EXISTS "jadwal_dosenId_idx" ON "jadwal"("dosenId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jadwal_dosenId_fkey'
  ) THEN
    ALTER TABLE "jadwal"
      ADD CONSTRAINT "jadwal_dosenId_fkey"
      FOREIGN KEY ("dosenId") REFERENCES "dosen"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "jadwal" DROP COLUMN IF EXISTS "lecturer";
