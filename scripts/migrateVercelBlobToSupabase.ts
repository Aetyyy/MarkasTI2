import "dotenv/config";
import { createHash } from "node:crypto";
import { del, get } from "@vercel/blob";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");
const deleteLegacy = process.argv.includes("--delete-legacy");
const allowedFolders = new Set(["profile", "team", "gallery"]);

function getLegacyDetails(value: string) {
  const url = new URL(value);
  const access: "public" | "private" | null = url.hostname.endsWith(".public.blob.vercel-storage.com")
    ? "public"
    : url.hostname.endsWith(".private.blob.vercel-storage.com")
      ? "private"
      : null;
  const pathname = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const folder = pathname.split("/")[0] || "";
  if (url.protocol !== "https:" || !access || !allowedFolders.has(folder)) {
    throw new Error(`URL Vercel Blob tidak dikenali atau folder tidak didukung: ${value}`);
  }
  return { access, pathname, folder };
}

function legacyToken(access: "public" | "private") {
  const token = (access === "public"
    ? process.env.BLOB_PUBLIC_READ_WRITE_TOKEN
    : process.env.BLOB_READ_WRITE_TOKEN)?.trim();
  if (!token) throw new Error(`Token Vercel Blob ${access} belum dikonfigurasi.`);
  return token;
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "images";
  if (!url || !key) throw new Error("Atur SUPABASE_URL dan SUPABASE_SECRET_KEY (atau SUPABASE_SERVICE_ROLE_KEY lama) sebelum migrasi.");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new Error("SUPABASE_URL harus menggunakan HTTPS.");
  }
  return { baseUrl: parsed.origin, key, bucket };
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function copyBlobToSupabase(oldUrl: string) {
  const { access, pathname, folder } = getLegacyDetails(oldUrl);
  const token = legacyToken(access);
  const source = await get(pathname, { access, token });
  if (!source || source.statusCode !== 200) throw new Error(`Tidak dapat membaca Blob lama: ${oldUrl}`);
  const bytes = Buffer.from(await new Response(source.stream).arrayBuffer());
  const contentType = source.blob.contentType || "application/octet-stream";
  const basename = pathname.split("/").at(-1) || "image";
  const suffix = createHash("sha256").update(oldUrl).digest("hex").slice(0, 16);
  const destinationPath = `${folder}/migrated-${suffix}-${basename}`;
  const { baseUrl, key, bucket } = supabaseConfig();
  const usesNewSecretKey = key.startsWith("sb_secret_");
  const objectUrl = `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(destinationPath)}`;

  const upload = await fetch(objectUrl, {
    method: "POST",
    headers: {
      apikey: key,
      ...(usesNewSecretKey ? {} : { Authorization: `Bearer ${key}` }),
      "Content-Type": contentType,
      "Cache-Control": "max-age=31536000, immutable",
      "x-upsert": "true",
    },
    body: bytes,
    cache: "no-store",
  });
  if (!upload.ok) {
    throw new Error(`Supabase menolak ${oldUrl} (${upload.status}): ${await upload.text()}`);
  }

  const publicUrl = `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodePath(destinationPath)}`;
  const verification = await fetch(publicUrl, { cache: "no-store" });
  if (!verification.ok) throw new Error(`Verifikasi URL Supabase gagal (${verification.status}): ${publicUrl}`);
  const copiedBytes = Buffer.from(await verification.arrayBuffer());
  const sourceHash = createHash("sha256").update(bytes).digest("hex");
  const copiedHash = createHash("sha256").update(copiedBytes).digest("hex");
  if (sourceHash !== copiedHash) throw new Error(`Verifikasi checksum gagal untuk ${oldUrl}`);
  return { publicUrl, access, token, pathname };
}

async function main() {
  if (deleteLegacy && !apply) {
    throw new Error("Gunakan --apply bersama --delete-legacy. Tanpa --apply, migrasi hanya simulasi.");
  }

  const [users, presets, galleryImages] = await Promise.all([
    prisma.user.findMany({ select: { id: true, image: true, teamImage: true } }),
    prisma.teamIdentityPreset.findMany({ select: { id: true, logoUrl: true } }),
    prisma.galleryImage.findMany({ select: { id: true, url: true, thumbnailUrl: true } }),
  ]);
  const candidates = [
    ...users.flatMap((item) => [item.image, item.teamImage]),
    ...presets.map((item) => item.logoUrl),
    ...galleryImages.flatMap((item) => [item.url, item.thumbnailUrl]),
  ].filter((value): value is string => Boolean(value));
  const legacyUrls = [...new Set(candidates.filter((value) => {
    try {
      const hostname = new URL(value).hostname;
      return hostname.endsWith(".public.blob.vercel-storage.com") || hostname.endsWith(".private.blob.vercel-storage.com");
    } catch {
      return false;
    }
  }))];

  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", uniqueLegacyFiles: legacyUrls.length, deleteLegacy }));
  if (!apply || legacyUrls.length === 0) return;

  const migrated = new Map<string, Awaited<ReturnType<typeof copyBlobToSupabase>>>();
  for (let index = 0; index < legacyUrls.length; index += 1) {
    const oldUrl = legacyUrls[index]!;
    console.log(`Memindahkan ${index + 1}/${legacyUrls.length}`);
    migrated.set(oldUrl, await copyBlobToSupabase(oldUrl));
  }
  const newUrl = (value: string | null) => value ? migrated.get(value)?.publicUrl || value : value;

  await prisma.$transaction(async (tx) => {
    for (const user of users) {
      const image = newUrl(user.image);
      const teamImage = newUrl(user.teamImage);
      if (image !== user.image || teamImage !== user.teamImage) {
        await tx.user.update({ where: { id: user.id }, data: { image, teamImage } });
      }
    }
    for (const preset of presets) {
      const logoUrl = newUrl(preset.logoUrl);
      if (logoUrl !== preset.logoUrl) {
        await tx.teamIdentityPreset.update({ where: { id: preset.id }, data: { logoUrl } });
      }
    }
    for (const image of galleryImages) {
      const url = newUrl(image.url);
      const thumbnailUrl = newUrl(image.thumbnailUrl);
      if (url !== image.url || thumbnailUrl !== image.thumbnailUrl) {
        await tx.galleryImage.update({ where: { id: image.id }, data: { url: url!, thumbnailUrl: thumbnailUrl! } });
      }
    }
  });

  const remaining = await Promise.all(legacyUrls.map(async (url) => {
    const [userImages, presetImages, galleryImages] = await Promise.all([
      prisma.user.count({ where: { OR: [{ image: url }, { teamImage: url }] } }),
      prisma.teamIdentityPreset.count({ where: { logoUrl: url } }),
      prisma.galleryImage.count({ where: { OR: [{ url }, { thumbnailUrl: url }] } }),
    ]);
    return { url, count: userImages + presetImages + galleryImages };
  }));
  const stillReferenced = remaining.filter((item) => item.count > 0);
  if (stillReferenced.length) {
    throw new Error(`Database masih memiliki ${stillReferenced.length} referensi Vercel Blob; file lama tidak dihapus.`);
  }

  if (deleteLegacy) {
    for (const [oldUrl, details] of migrated) {
      await del(oldUrl, { token: details.token });
    }
  }
  console.log(JSON.stringify({ migratedFiles: migrated.size, updatedRecords: true, deletedLegacyFiles: deleteLegacy ? migrated.size : 0 }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
