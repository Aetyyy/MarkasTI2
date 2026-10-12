CREATE TABLE "mata_kuliah" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sks" INTEGER NOT NULL DEFAULT 2,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mata_kuliah_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dosen_mata_kuliah" (
    "dosenId" INTEGER NOT NULL,
    "mataKuliahId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "dosen_mata_kuliah_pkey" PRIMARY KEY ("dosenId", "mataKuliahId")
);

ALTER TABLE "jadwal" ADD COLUMN "mataKuliahId" INTEGER;

CREATE UNIQUE INDEX "mata_kuliah_code_key" ON "mata_kuliah"("code");
CREATE INDEX "mata_kuliah_name_idx" ON "mata_kuliah"("name");
CREATE INDEX "mata_kuliah_isActive_idx" ON "mata_kuliah"("isActive");
CREATE INDEX "dosen_mata_kuliah_mataKuliahId_idx" ON "dosen_mata_kuliah"("mataKuliahId");
CREATE INDEX "jadwal_mataKuliahId_idx" ON "jadwal"("mataKuliahId");

ALTER TABLE "dosen_mata_kuliah" ADD CONSTRAINT "dosen_mata_kuliah_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "dosen"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "dosen_mata_kuliah" ADD CONSTRAINT "dosen_mata_kuliah_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "mata_kuliah"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "jadwal" ADD CONSTRAINT "jadwal_mataKuliahId_fkey" FOREIGN KEY ("mataKuliahId") REFERENCES "mata_kuliah"("id") ON DELETE SET NULL ON UPDATE CASCADE;
