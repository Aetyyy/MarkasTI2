CREATE TABLE "team_identity_presets" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_identity_presets_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "team_identity_presets_code_key"
ON "team_identity_presets"("code");

CREATE INDEX "team_identity_presets_isActive_idx"
ON "team_identity_presets"("isActive");

INSERT INTO "team_identity_presets"
    ("id", "code", "name", "isActive", "createdAt", "updatedAt")
VALUES
    ('preset_std', 'STD', 'Standard', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('preset_dev', 'DEV', 'Developer', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('preset_uix', 'UIX', 'UI/UX Designer', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('preset_fe', 'FE', 'Frontend', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('preset_be', 'BE', 'Backend', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('preset_data', 'DATA', 'Data & Database', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
