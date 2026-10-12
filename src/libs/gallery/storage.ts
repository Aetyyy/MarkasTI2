import "server-only";

import { deleteImageBlob, isVercelBlobUrl } from "@/libs/vercelBlob";

export async function deleteUploadFileByUrl(url: string) {
  if (!isVercelBlobUrl(url, "gallery")) return;
  await deleteImageBlob(url);
}
