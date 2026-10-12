ALTER TABLE "User"
  ADD COLUMN "notifyGalleryUploads" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "notifyAnnouncements" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "announcements" (
  "id" TEXT NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "body" VARCHAR(1000) NOT NULL,
  "url" VARCHAR(255),
  "isPublished" BOOLEAN NOT NULL DEFAULT false,
  "publishedAt" TIMESTAMP(3),
  "createdBy" VARCHAR(120),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "announcements_isPublished_publishedAt_idx"
  ON "announcements"("isPublished", "publishedAt");
