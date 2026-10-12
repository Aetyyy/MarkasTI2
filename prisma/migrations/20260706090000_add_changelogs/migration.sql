CREATE TABLE "changelogs" (
    "id" TEXT NOT NULL,
    "version" VARCHAR(30) NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "summary" VARCHAR(500) NOT NULL,
    "details" TEXT,
    "type" VARCHAR(30) NOT NULL DEFAULT 'IMPROVEMENT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "authorName" VARCHAR(120),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "changelogs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "changelogs_version_key" ON "changelogs"("version");
CREATE INDEX "changelogs_isPublished_publishedAt_idx" ON "changelogs"("isPublished", "publishedAt");
CREATE INDEX "changelogs_sortOrder_idx" ON "changelogs"("sortOrder");
