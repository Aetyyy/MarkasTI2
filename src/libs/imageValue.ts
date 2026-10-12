import "server-only";

import { isVercelBlobUrl } from "@/libs/vercelBlob";

export function isPrototypeImage(value?: string | null) {
  return !value || value.startsWith("prototype://") || value.startsWith("data:");
}

/** Only cloud-backed image URLs are accepted as persisted user images. */
export function normalizeStoredImage(value: unknown) {
  const image = String(value ?? "").trim();
  if (!image || image.startsWith("prototype://") || image.startsWith("data:")) return null;
  return isVercelBlobUrl(image) ? image : null;
}
