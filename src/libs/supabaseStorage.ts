import "server-only";

export type StorageImageFolder = "profile" | "team" | "gallery";

function getStorageConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "images";

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase Storage belum dikonfigurasi. Atur SUPABASE_URL dan SUPABASE_SECRET_KEY (atau SUPABASE_SERVICE_ROLE_KEY lama).",
    );
  }
  if (!/^[a-z0-9][a-z0-9_-]{0,62}$/i.test(bucket)) {
    throw new Error("Nama bucket Supabase Storage tidak valid.");
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(url);
  } catch {
    throw new Error("SUPABASE_URL bukan URL yang valid.");
  }
  if (baseUrl.protocol !== "https:" && baseUrl.hostname !== "localhost") {
    throw new Error("SUPABASE_URL harus menggunakan HTTPS.");
  }

  return { baseUrl: baseUrl.origin, serviceRoleKey, bucket };
}

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function normalizeObjectPath(path: string, folder?: StorageImageFolder) {
  const segments = path.replace(/^\/+/, "").split("/");
  if (
    segments.length < 2 ||
    segments.some((segment) => !segment || segment === "." || segment === "..") ||
    (folder && segments[0] !== folder)
  ) {
    throw new Error("Path objek Supabase Storage tidak valid.");
  }
  return segments.join("/");
}

export function getSupabaseStorageObjectPath(
  value: string,
  folder?: StorageImageFolder,
) {
  try {
    const { baseUrl, bucket } = getStorageConfig();
    const parsed = new URL(value);
    const prefix = `/storage/v1/object/public/${bucket}/`;
    if (parsed.protocol !== "https:" || parsed.origin !== baseUrl || !parsed.pathname.startsWith(prefix)) {
      return null;
    }
    const encodedPath = parsed.pathname.slice(prefix.length);
    const path = decodeURIComponent(encodedPath);
    return normalizeObjectPath(path, folder);
  } catch {
    return null;
  }
}

export function isSupabaseStorageUrl(value: string, folder?: StorageImageFolder) {
  return getSupabaseStorageObjectPath(value, folder) !== null;
}

export async function uploadToSupabaseStorage({
  path,
  file,
  contentType,
}: {
  path: string;
  file: Blob;
  contentType: string;
}) {
  const { baseUrl, serviceRoleKey, bucket } = getStorageConfig();
  const usesNewSecretKey = serviceRoleKey.startsWith("sb_secret_");
  const objectPath = normalizeObjectPath(path);
  const response = await fetch(
    `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodePath(objectPath)}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        ...(usesNewSecretKey ? {} : { Authorization: `Bearer ${serviceRoleKey}` }),
        "Content-Type": contentType,
        "Cache-Control": "max-age=31536000, immutable",
        "x-upsert": "false",
      },
      body: file,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase Storage menolak upload (${response.status})${detail ? `: ${detail}` : "."}`);
  }

  return `${baseUrl}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodePath(objectPath)}`;
}

export async function deleteFromSupabaseStorage(value: string, folder?: StorageImageFolder) {
  const objectPath = getSupabaseStorageObjectPath(value, folder);
  if (!objectPath) return false;

  const { baseUrl, serviceRoleKey, bucket } = getStorageConfig();
  const usesNewSecretKey = serviceRoleKey.startsWith("sb_secret_");
  const response = await fetch(
    `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`,
    {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        ...(usesNewSecretKey ? {} : { Authorization: `Bearer ${serviceRoleKey}` }),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: [objectPath] }),
      cache: "no-store",
    },
  );

  if (!response.ok && response.status !== 404) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Supabase Storage gagal menghapus file (${response.status})${detail ? `: ${detail}` : "."}`);
  }
  return true;
}
