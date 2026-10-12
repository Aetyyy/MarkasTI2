import "server-only";

import { del } from "@vercel/blob";

export type ImageFolder = "profile" | "team" | "gallery";

function blobTokenFor(value: string) {
  const isPublic = value.includes(".public.blob.vercel-storage.com/");
  const token = isPublic
    ? process.env.BLOB_PUBLIC_READ_WRITE_TOKEN?.trim()
    : process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new Error(
      isPublic
        ? "Vercel Blob publik belum dikonfigurasi. Tambahkan BLOB_PUBLIC_READ_WRITE_TOKEN."
        : "Vercel Blob private belum dikonfigurasi. Tambahkan BLOB_READ_WRITE_TOKEN.",
    );
  }
  return token;
}

export function isVercelBlobUrl(value: string, folder?: ImageFolder) {
  try {
    const parsed = new URL(value);
    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname.endsWith(".public.blob.vercel-storage.com") ||
        parsed.hostname.endsWith(".private.blob.vercel-storage.com")) &&
      pathSegments.length >= 2 &&
      (!folder || pathSegments[0] === folder)
    );
  } catch {
    return false;
  }
}

export function getVercelBlobAccess(value: string): "public" | "private" | null {
  try {
    const hostname = new URL(value).hostname;
    if (hostname.endsWith(".public.blob.vercel-storage.com")) return "public";
    if (hostname.endsWith(".private.blob.vercel-storage.com")) return "private";
    return null;
  } catch {
    return null;
  }
}

export async function deleteImageBlob(url?: string | null) {
  const cleanUrl = url?.trim();
  if (!cleanUrl) return false;

  if (!isVercelBlobUrl(cleanUrl)) return false;

  await del(cleanUrl, { token: blobTokenFor(cleanUrl) });
  return true;
}
