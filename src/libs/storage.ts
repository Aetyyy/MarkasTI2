import "server-only";
import { isPrototypeImage, normalizeStoredImage } from "@/libs/imageValue";
import { deleteImageBlob } from "@/libs/vercelBlob";

export { isPrototypeImage, normalizeStoredImage };

export async function deleteStorageImage(image?: string | null) {
  await deleteImageBlob(image);
}
