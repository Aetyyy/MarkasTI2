import "dotenv/config";
import { get, put } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";
import { readdir, readFile, rm, stat } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();
const projectRoot = process.cwd();
const storageRoot = path.join(projectRoot, "storage");
const apply = process.argv.includes("--apply");
const deleteLocal = process.argv.includes("--delete-local");

function blobPathFor(relativePath: string) {
  const normalized = relativePath.replace(/\\/g, "/");
  const withoutUploads = normalized.startsWith("uploads/")
    ? normalized.slice("uploads/".length)
    : normalized;
  const [folder] = withoutUploads.split("/");
  if (!["profile", "team", "gallery"].includes(folder || "")) return null;
  return withoutUploads;
}

async function collectFiles(directory: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const files: string[] = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectFiles(absolutePath)));
    else if (entry.isFile()) files.push(absolutePath);
  }
  return files;
}

function localPathForUrl(url: string) {
  if (!url.startsWith("/api/uploads/")) return null;
  const relative = decodeURIComponent(url.slice("/api/uploads/".length))
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  const normalized = path.posix.normalize(relative);
  if (normalized.startsWith("../") || normalized === ".." || path.posix.isAbsolute(normalized)) return null;
  return path.join(storageRoot, "uploads", ...normalized.split("/"));
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    throw new Error("BLOB_READ_WRITE_TOKEN belum dikonfigurasi.");
  }

  const [users, galleryImages, files] = await Promise.all([
    prisma.user.findMany({ select: { id: true, image: true, teamImage: true } }),
    prisma.galleryImage.findMany({ select: { id: true, url: true, thumbnailUrl: true } }),
    collectFiles(storageRoot),
  ]);

  const urls = [
    ...users.flatMap((user) => [user.image, user.teamImage]),
    ...galleryImages.flatMap((image) => [image.url, image.thumbnailUrl]),
  ].filter((url): url is string => Boolean(url?.startsWith("/api/uploads/")));
  const referencedFiles = new Map<string, string>();
  for (const url of urls) {
    const localPath = localPathForUrl(url);
    if (!localPath) throw new Error(`Path gambar lokal tidak aman: ${url}`);
    try {
      await stat(localPath);
      referencedFiles.set(url, localPath);
    } catch {
      throw new Error(`File untuk gambar yang masih dipakai tidak ditemukan: ${url}`);
    }
  }

  const uploadFiles = files
    .map((absolutePath) => ({
      absolutePath,
      relativePath: path.relative(storageRoot, absolutePath),
      pathname: blobPathFor(path.relative(storageRoot, absolutePath)),
    }))
    .filter((entry): entry is typeof entry & { pathname: string } => Boolean(entry.pathname));

  console.log(
    JSON.stringify({
      mode: apply ? "apply" : "dry-run",
      referencedLocalUrls: urls.length,
      uniqueReferencedFiles: referencedFiles.size,
      localImageFiles: uploadFiles.length,
      willDeleteLocalFiles: deleteLocal,
    }),
  );
  if (!apply) return;

  const migrated = new Map<string, string>();
  for (const entry of uploadFiles) {
    const bytes = await readFile(entry.absolutePath);
    const extension = path.extname(entry.absolutePath).toLowerCase();
    const contentType = extension === ".png" ? "image/png" : extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/webp";
    const blob = await put(entry.pathname, bytes, {
      access: "private",
      addRandomSuffix: true,
      contentType,
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    const verification = await get(blob.pathname, { access: "private" });
    if (!verification || verification.statusCode !== 200) {
      throw new Error(`Verifikasi Vercel Blob gagal untuk ${entry.relativePath}; file lokal tetap dipertahankan.`);
    }
    await verification.stream.cancel();
    migrated.set(entry.absolutePath, blob.url);
  }

  const migratedUrl = (url: string | null) => {
    if (!url?.startsWith("/api/uploads/")) return url;
    const localPath = referencedFiles.get(url) || localPathForUrl(url);
    if (!localPath) throw new Error(`Tidak bisa menentukan file lokal untuk ${url}`);
    const blobUrl = migrated.get(localPath);
    if (!blobUrl) throw new Error(`File belum berhasil dimigrasikan: ${url}`);
    return blobUrl;
  };

  await prisma.$transaction(async (tx) => {
    for (const user of users) {
      const image = migratedUrl(user.image);
      const teamImage = migratedUrl(user.teamImage);
      if (image !== user.image || teamImage !== user.teamImage) {
        await tx.user.update({ where: { id: user.id }, data: { image: image!, teamImage: teamImage! } });
      }
    }
    for (const image of galleryImages) {
      const url = migratedUrl(image.url);
      const thumbnailUrl = migratedUrl(image.thumbnailUrl);
      if (url !== image.url || thumbnailUrl !== image.thumbnailUrl) {
        await tx.galleryImage.update({ where: { id: image.id }, data: { url: url!, thumbnailUrl: thumbnailUrl! } });
      }
    }
  });

  const remainingLocalReferences = await Promise.all([
    prisma.user.count({ where: { OR: [{ image: { startsWith: "/api/uploads/" } }, { teamImage: { startsWith: "/api/uploads/" } }] } }),
    prisma.galleryImage.count({ where: { OR: [{ url: { startsWith: "/api/uploads/" } }, { thumbnailUrl: { startsWith: "/api/uploads/" } }] } }),
  ]).then((counts) => counts.reduce((sum, count) => sum + count, 0));
  if (remainingLocalReferences > 0) {
    throw new Error(`Pembaruan database belum tuntas; masih ada ${remainingLocalReferences} record dengan URL lokal. File lokal tidak dihapus.`);
  }

  if (deleteLocal) {
    for (const entry of uploadFiles) await rm(entry.absolutePath);
    for (const directory of ["profile", "team", "uploads"]) {
      const absolutePath = path.join(storageRoot, directory);
      try {
        const remaining = await readdir(absolutePath);
        if (remaining.length === 0) await rm(absolutePath, { recursive: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
  }

  console.log(JSON.stringify({ migratedFiles: migrated.size, remainingLocalReferences, deletedLocalFiles: deleteLocal ? uploadFiles.length : 0 }));
}

main()
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
