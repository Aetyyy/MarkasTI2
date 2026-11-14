import "server-only";

import { deleteImageBlob, isStorageImageUrl } from "@/libs/vercelBlob";

export async function deleteUploadFileByUrl(url: string) {
  if (!isStorageImageUrl(url, "gallery")) return;
  await deleteImageBlob(url);
}
