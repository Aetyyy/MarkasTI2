-- CreateTable
CREATE TABLE "dosen" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nip" VARCHAR(50),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dosen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" SERIAL NOT NULL,
    "dosenId" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "time" TIME NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kas_masuk" (
    "id" SERIAL NOT NULL,
    "dosenId" INTEGER,
    "amount" BIGINT NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "paymentMethod" VARCHAR(50) NOT NULL,
    "qrcodeData" TEXT,
    "date" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kas_masuk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kas_keluar" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "amount" BIGINT NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "date" DATE NOT NULL,
    "approvedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kas_keluar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jadwal" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "date" DATE NOT NULL,
    "time" TIME,
    "description" TEXT,
    "location" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "jadwal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "struktur_kelas" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(100) NOT NULL,
    "photo" VARCHAR(255),
    "year" VARCHAR(50),
    "contact" VARCHAR(20),

    CONSTRAINT "struktur_kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_user" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_user_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_dosenId_idx" ON "attendance"("dosenId");

-- CreateIndex
CREATE INDEX "attendance_date_idx" ON "attendance"("date");

-- CreateIndex
CREATE INDEX "kas_masuk_date_idx" ON "kas_masuk"("date");

-- CreateIndex
CREATE INDEX "kas_keluar_date_idx" ON "kas_keluar"("date");

-- CreateIndex
CREATE INDEX "jadwal_date_idx" ON "jadwal"("date");

-- CreateIndex
CREATE UNIQUE INDEX "admin_user_email_key" ON "admin_user"("email");

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "dosen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kas_masuk" ADD CONSTRAINT "kas_masuk_dosenId_fkey" FOREIGN KEY ("dosenId") REFERENCES "dosen"("id") ON DELETE SET NULL ON UPDATE CASCADE;
