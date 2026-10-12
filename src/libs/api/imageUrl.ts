/** Translate private Vercel Blob URLs to our same-origin streaming endpoint. */
export function getDisplayImageUrl(value?: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value);
    if (!url.hostname.endsWith(".private.blob.vercel-storage.com")) return value;
    const pathname = url.pathname.split("/").filter(Boolean);
    return pathname.length >= 2
      ? `/api/images/${pathname.map(encodeURIComponent).join("/")}`
      : "";
  } catch {
    return value;
  }
}
