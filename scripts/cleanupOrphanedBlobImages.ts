import "dotenv/config";
import { del, list, type ListBlobResultBlob } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--delete");
const includeRecent = process.argv.includes("--include-recent");
const MINIMUM_AGE_MS = 60 * 60 * 1000;
const prefixes = ["profile/", "team/", "gallery/"];

async function listAll(prefix: string) {
  const blobs: ListBlobResultBlob[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, limit: 1000, cursor });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    throw new Error("BLOB_READ_WRITE_TOKEN belum dikonfigurasi.");
  }

  const [users, presets, galleryImages, ...blobGroups] = await Promise.all([
    prisma.user.findMany({ select: { image: true, teamImage: true } }),
    prisma.teamIdentityPreset.findMany({ select: { logoUrl: true } }),
    prisma.galleryImage.findMany({ select: { url: true, thumbnailUrl: true } }),
    ...prefixes.map(listAll),
  ]);
  const referenced = new Set(
    [
      ...users.flatMap((user) => [user.image, user.teamImage]),
      ...presets.map((preset) => preset.logoUrl),
      ...galleryImages.flatMap((image) => [image.url, image.thumbnailUrl]),
    ].filter((url): url is string => Boolean(url)),
  );
  const blobs = blobGroups.flat();
  const now = Date.now();
  const orphaned = blobs.filter((blob) => !referenced.has(blob.url));
  const eligible = includeRecent
    ? orphaned
    : orphaned.filter((blob) => now - blob.uploadedAt.getTime() >= MINIMUM_AGE_MS);
  const recent = orphaned.length - eligible.length;

  console.log(
    JSON.stringify({
      mode: apply ? "delete" : "dry-run",
      includeRecentOrphans: includeRecent,
      scannedImages: blobs.length,
      referencedImages: blobs.length - orphaned.length,
      orphanedImages: orphaned.length,
      recentOrphansKeptForSafety: recent,
      imagesToDelete: eligible.length,
    }),
  );

  if (apply) {
    for (const blob of eligible) await del(blob.url);
    console.log(JSON.stringify({ deletedImages: eligible.length }));
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
